import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyEquivalence, loadLocalModel } from './verify_tfjs_equivalence.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function fixture() {
  const parent = path.join(workspace, 'analysis', 'revision_smoke', 'node_tmp');
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'case-'));
  const relative = path.relative(workspace, path.resolve(directory));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Fixture cleanup target leaves workspace');
  const topology = {
    node: [
      { name: 'input', op: 'Placeholder', attr: { dtype: { type: 'DT_FLOAT' }, shape: { shape: { dim: [{ size: '-1' }, { size: '1' }, { size: '1' }] } } } },
      { name: 'weight', op: 'Const', attr: { dtype: { type: 'DT_FLOAT' }, value: { tensor: { dtype: 'DT_FLOAT', tensorShape: {} } } } },
      { name: 'multiply', op: 'Mul', input: ['input', 'weight'], attr: { T: { type: 'DT_FLOAT' } } },
      { name: 'Identity', op: 'Identity', input: ['multiply'], attr: { T: { type: 'DT_FLOAT' } } },
    ], library: {}, versions: { producer: 1, minConsumer: 0 },
  };
  for (const name of ['float', 'uint8']) {
    const target = path.join(directory, name);
    await fs.mkdir(target);
    const weight = { name: 'weight', shape: [], dtype: 'float32' };
    let bytes;
    if (name === 'uint8') {
      weight.quantization = { dtype: 'uint8', min: 0, scale: 0.1 };
      bytes = Buffer.from([20]);
    } else {
      bytes = Buffer.alloc(4);
      bytes.writeFloatLE(2);
    }
    await fs.writeFile(path.join(target, 'weights.bin'), bytes);
    await fs.writeFile(path.join(target, 'model.json'), JSON.stringify({ format: 'graph-model', modelTopology: topology,
      weightsManifest: [{ paths: ['weights.bin'], weights: [weight] }] }));
  }
  const casePath = path.join(directory, 'case.json');
  const reference = { zone: 'synthetic_fixture', model: 'test_multiply', selected_seed: 42, provenance_class: 'synthetic_smoke_test',
    input_shape: [3, 1, 1], inputs: [[[1]], [[2]], [[3]]], actual_physical: [2, 4, 6],
    keras_float_scaled_predictions: [2, 4, 6], keras_float_physical_predictions: [2, 4, 6],
    target_scaler: { scale: 1, min: 0 }, prediction_bounds: { lower: 0, upper: null },
    float_equivalence_tolerances: { absolute: 1e-5, relative: 1e-4 } };
  await fs.writeFile(casePath, JSON.stringify(reference));
  return {
    directory, reference,
    options: { floatModel: path.join(directory, 'float', 'model.json'), quantizedModel: path.join(directory, 'uint8', 'model.json'),
      casePath, outputPath: path.join(directory, 'result.json') },
    cleanup: async () => {
      const resolved = path.resolve(directory);
      const rel = path.relative(workspace, resolved);
      assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
      await fs.rm(resolved, { recursive: true, force: true });
    },
  };
}

test('loads graph exports and dequantizes uint8 storage correctly', async () => {
  const data = await fixture();
  try {
    const result = await verifyEquivalence(data.options);
    assert.equal(result.float_equivalence_passed, true);
    assert.equal(result.integer_only_inference, false);
    assert.equal(result.test_metrics.tfjs_float_mae, 0);
    assert.equal(result.test_metrics.tfjs_uint8_weight_storage_mae, 0);
    assert.equal(result.test_metrics.mae_degradation_percent, null);
    assert.equal(result.uint8_model.quantized_weight_count, 1);
    assert.equal(result.float_model.format, 'graph-model');
  } finally { await data.cleanup(); }
});

test('fails parity when the FP32 export disagrees with the selected Keras reference', async () => {
  const data = await fixture();
  try {
    data.reference.keras_float_scaled_predictions = [3, 5, 7];
    data.reference.keras_float_physical_predictions = [3, 5, 7];
    await fs.writeFile(data.options.casePath, JSON.stringify(data.reference));
    const result = await verifyEquivalence(data.options);
    assert.equal(result.float_equivalence_passed, false);
    assert.equal(result.status, 'failed');
    assert.equal(JSON.parse(await fs.readFile(data.options.outputPath, 'utf8')).status, 'failed');
  } finally { await data.cleanup(); }
});

test('rejects undeclared or nonfinite tensor inputs', async () => {
  const data = await fixture();
  try {
    data.reference.inputs[0][0][0] = null;
    await fs.writeFile(data.options.casePath, JSON.stringify(data.reference));
    await assert.rejects(verifyEquivalence(data.options), /test tensors/);
  } finally { await data.cleanup(); }
});

test('rejects weight manifests that leave the local model directory', async () => {
  const data = await fixture();
  try {
    const parsed = JSON.parse(await fs.readFile(data.options.floatModel, 'utf8'));
    parsed.weightsManifest[0].paths = ['../../outside.bin'];
    await fs.writeFile(data.options.floatModel, JSON.stringify(parsed));
    await assert.rejects(loadLocalModel(data.options.floatModel), /leaves model directory/);
  } finally { await data.cleanup(); }
});
