/** Compare official TF.js exports with the selected Keras model on fixed held-out inputs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as tf from '@tensorflow/tfjs';

const sha256 = data => createHash('sha256').update(data).digest('hex');

function finiteArray(values, name, count) {
  if (!Array.isArray(values) || values.length !== count || !values.every(Number.isFinite)) {
    throw new Error(`${name} must contain exactly ${count} finite numbers`);
  }
  return values;
}

export async function loadLocalModel(modelPath) {
  const jsonBytes = await fs.readFile(modelPath);
  const parsed = JSON.parse(jsonBytes.toString('utf8'));
  const directory = path.dirname(path.resolve(modelPath));
  if (!['graph-model', 'layers-model'].includes(parsed.format)) {
    throw new Error(`Unsupported TensorFlow.js model format: ${parsed.format}`);
  }
  if (!Array.isArray(parsed.weightsManifest)) throw new Error('Missing weightsManifest');
  const specs = [];
  const chunks = [];
  const files = [{ path: path.basename(modelPath), bytes: jsonBytes.length, sha256: sha256(jsonBytes) }];
  for (const group of parsed.weightsManifest) {
    specs.push(...group.weights);
    for (const shard of group.paths) {
      const filename = path.resolve(directory, shard);
      const relative = path.relative(directory, filename);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Weight shard leaves model directory');
      const bytes = await fs.readFile(filename);
      chunks.push(bytes);
      files.push({ path: shard, bytes: bytes.length, sha256: sha256(bytes) });
    }
  }
  const combined = Buffer.concat(chunks);
  const artifacts = {
    modelTopology: parsed.modelTopology,
    weightSpecs: specs,
    weightData: combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength),
    format: parsed.format,
    generatedBy: parsed.generatedBy,
    convertedBy: parsed.convertedBy,
    signature: parsed.signature,
    userDefinedMetadata: parsed.userDefinedMetadata,
  };
  const handler = { load: async () => artifacts };
  const model = parsed.format === 'graph-model' ? await tf.loadGraphModel(handler) : await tf.loadLayersModel(handler);
  return {
    model,
    format: parsed.format,
    files,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    quantizedWeights: specs.filter(spec => spec.quantization?.dtype === 'uint8').length,
  };
}

async function predict(model, format, input, expectedCount) {
  const outputs = format === 'graph-model' ? await model.executeAsync(input) : model.predict(input);
  try {
    const tensors = outputs instanceof tf.Tensor ? [outputs] : Array.isArray(outputs) ? outputs : Object.values(outputs);
    if (tensors.length !== 1 || tensors[0].size !== expectedCount) {
      throw new Error('The revision contract requires one scalar forecast per input sequence');
    }
    return finiteArray(Array.from(await tensors[0].data()), 'TF.js predictions', expectedCount);
  } finally {
    tf.dispose(outputs);
  }
}

function comparison(first, second) {
  const differences = first.map((value, index) => Math.abs(value - second[index]));
  return {
    max: Math.max(...differences),
    mean: differences.reduce((sum, value) => sum + value, 0) / differences.length,
  };
}

function physical(values, scaler, bounds) {
  if (!Number.isFinite(scaler.scale) || scaler.scale <= 0 || !Number.isFinite(scaler.min)) {
    throw new Error('Invalid training-only target scaler');
  }
  return values.map(value => {
    let result = (value - scaler.min) / scaler.scale;
    if (bounds.lower != null) result = Math.max(bounds.lower, result);
    if (bounds.upper != null) result = Math.min(bounds.upper, result);
    return result;
  });
}

function mae(actual, predicted) {
  return actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0) / actual.length;
}

export async function verifyEquivalence({ floatModel, quantizedModel, casePath, outputPath }) {
  let floatLoaded, quantizedLoaded, inputs;
  try {
    const caseBytes = await fs.readFile(casePath);
    const reference = JSON.parse(caseBytes.toString('utf8'));
    const shape = reference.input_shape;
    if (!Array.isArray(shape) || shape.length !== 3 || !shape.every(value => Number.isInteger(value) && value > 0)) {
      throw new Error('input_shape must be [observations, lookback, features]');
    }
    const [count, lookback, features] = shape;
    if (!Array.isArray(reference.inputs) || reference.inputs.length !== count ||
        !reference.inputs.every(sequence => Array.isArray(sequence) && sequence.length === lookback &&
          sequence.every(row => Array.isArray(row) && row.length === features && row.every(Number.isFinite)))) {
      throw new Error('Fixed test tensors disagree with input_shape');
    }
    const kerasScaled = finiteArray(reference.keras_float_scaled_predictions, 'Keras scaled predictions', count);
    const actual = finiteArray(reference.actual_physical, 'Physical targets', count);
    const bounds = reference.prediction_bounds ?? {};
    const kerasPhysical = physical(kerasScaled, reference.target_scaler, bounds);
    if (reference.keras_float_physical_predictions) {
      const declared = finiteArray(reference.keras_float_physical_predictions, 'Keras physical predictions', count);
      if (declared.some((value, index) => Math.abs(value - kerasPhysical[index]) > 1e-8 * Math.max(1, Math.abs(value)))) {
        throw new Error('Declared physical Keras predictions disagree with the inverse scaling and constraints');
      }
    }
    await tf.setBackend('cpu');
    await tf.ready();
    floatLoaded = await loadLocalModel(floatModel);
    quantizedLoaded = await loadLocalModel(quantizedModel);
    if (!quantizedLoaded.quantizedWeights) throw new Error('The uint8 export contains no uint8-quantized weights');
    inputs = tf.tensor3d(reference.inputs, shape, 'float32');
    const floatScaled = await predict(floatLoaded.model, floatLoaded.format, inputs, count);
    const quantizedScaled = await predict(quantizedLoaded.model, quantizedLoaded.format, inputs, count);
    const floatPhysical = physical(floatScaled, reference.target_scaler, bounds);
    const quantizedPhysical = physical(quantizedScaled, reference.target_scaler, bounds);
    const tolerance = reference.float_equivalence_tolerances ?? { absolute: 1e-5, relative: 1e-4 };
    if (![tolerance.absolute, tolerance.relative].every(value => Number.isFinite(value) && value >= 0)) {
      throw new Error('Float-equivalence tolerances must be finite and nonnegative');
    }
    const passed = floatScaled.every((value, index) =>
      Math.abs(value - kerasScaled[index]) <= tolerance.absolute + tolerance.relative * Math.abs(kerasScaled[index]));
    const kerasVsFloat = comparison(kerasScaled, floatScaled);
    const floatVsQuantized = comparison(floatScaled, quantizedScaled);
    const physicalDifference = comparison(floatPhysical, quantizedPhysical);
    const floatMae = mae(actual, floatPhysical);
    const quantizedMae = mae(actual, quantizedPhysical);
    const result = {
      status: passed ? 'completed' : 'failed',
      float_equivalence_passed: passed,
      zone: reference.zone,
      model: reference.model,
      selected_seed: reference.selected_seed,
      observations: count,
      input_shape: shape,
      provenance_class: reference.provenance_class,
      backend: 'cpu',
      runtime: 'Node.js TensorFlow.js',
      node_version: process.version,
      tensorflowjs_version: tf.version.tfjs,
      case_sha256: sha256(caseBytes),
      float_equivalence_tolerances: tolerance,
      float_model: { format: floatLoaded.format, total_bytes: floatLoaded.totalBytes, files: floatLoaded.files },
      uint8_model: { format: quantizedLoaded.format, total_bytes: quantizedLoaded.totalBytes, files: quantizedLoaded.files,
        quantized_weight_count: quantizedLoaded.quantizedWeights },
      keras_vs_tfjs_float: { max_abs_scaled_difference: kerasVsFloat.max, mean_abs_scaled_difference: kerasVsFloat.mean },
      tfjs_float_vs_uint8: {
        max_abs_scaled_difference: floatVsQuantized.max,
        mean_abs_scaled_difference: floatVsQuantized.mean,
        mean_abs_physical_difference: physicalDifference.mean,
        max_abs_physical_difference: physicalDifference.max,
      },
      test_metrics: {
        keras_float_mae: mae(actual, kerasPhysical),
        tfjs_float_mae: floatMae,
        tfjs_uint8_weight_storage_mae: quantizedMae,
        mae_degradation_absolute: quantizedMae - floatMae,
        mae_degradation_percent: floatMae > 0 ? 100 * (quantizedMae - floatMae) / floatMae : null,
        size_reduction_percent: 100 * (1 - quantizedLoaded.totalBytes / floatLoaded.totalBytes),
      },
      per_observation: actual.map((value, index) => ({
        date: reference.dates?.[index] ?? null,
        actual: value, keras_scaled: kerasScaled[index], tfjs_float_scaled: floatScaled[index],
        tfjs_uint8_scaled: quantizedScaled[index], keras_physical: kerasPhysical[index],
        tfjs_float_physical: floatPhysical[index], tfjs_uint8_physical: quantizedPhysical[index],
      })),
      quantization_scope: 'uint8 weight storage dequantized for float arithmetic; not integer-only INT8 kernels',
      integer_only_inference: false,
      interpretation_limit: 'A Node CPU numerical comparison establishes export fidelity; it is not a mobile browser latency or offline deployment test',
    };
    if (!passed) result.error = 'Keras and the FP32 TF.js export exceed the pre-specified allclose tolerance';
    if (outputPath) {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
    }
    return result;
  } finally {
    inputs?.dispose();
    floatLoaded?.model.dispose();
    quantizedLoaded?.model.dispose();
  }
}

function parseArgs(argv) {
  const mapping = { '--float-model': 'floatModel', '--quantized-model': 'quantizedModel', '--case': 'casePath', '--output': 'outputPath' };
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = mapping[argv[index]];
    if (!key || !argv[index + 1]) throw new Error(`Unknown or incomplete option ${argv[index]}`);
    result[key] = path.resolve(argv[index + 1]);
  }
  if (Object.values(mapping).some(key => !result[key])) throw new Error('All four model, case and output paths are required');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    const result = await verifyEquivalence(options);
    console.log(JSON.stringify({ status: result.status, zone: result.zone, observations: result.observations,
      float_equivalence_passed: result.float_equivalence_passed }));
    if (!result.float_equivalence_passed) process.exitCode = 1;
  } catch (error) {
    const result = { status: 'failed', float_equivalence_passed: false, error: error.message };
    if (options?.outputPath) {
      await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
      await fs.writeFile(options.outputPath, JSON.stringify(result, null, 2), 'utf8');
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
