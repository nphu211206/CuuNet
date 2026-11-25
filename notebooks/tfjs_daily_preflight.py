"""Compatibility check for the actual 30x5 and 30x8 deployment shapes; no performance claims."""
import argparse,json
from pathlib import Path
import numpy as np
import revision_experiments as exp

def run(output):
    if exp.tf is None: raise RuntimeError("Use the locked TensorFlow environment")
    output.mkdir(parents=True,exist_ok=True); selections=[]
    for features in (5,8):
        seed=42+features
        exp.keras.backend.clear_session(); exp.set_seed(seed)
        model=exp.build_neural_model(lookback=30,feature_count=features,lstm_units=64,attention_units=32,
                                     dropout=.2,use_attention=True,unroll_lstm=True)
        x=np.random.default_rng(42).random((8,30,features),dtype=np.float32)
        predictions=np.asarray(model(x,training=False)).reshape(-1)
        name=f"shape_30_{features}"; path=output/(name+".keras"); model.save(path)
        case={"zone":name,"model":"ta_lstm_outage","selected_seed":seed,"input_shape":list(x.shape),"inputs":x.tolist(),
            "keras_float_scaled_predictions":predictions.tolist(),"actual_physical":np.zeros(8).tolist(),
            "target_scaler":{"scale":1.,"min":0.},"prediction_bounds":{"lower":0.,"upper":None},
            "float_equivalence_tolerances":{"absolute":1e-5,"relative":1e-4},
            "provenance_class":"synthetic","publication_eligible":False,
            "interpretation":"Random compatibility tensors, not hydrological forecasts or accuracy evidence"}
        exp.write_json(output/"tfjs_equivalence_cases"/(name+".json"),case)
        selections.append({"zone":name,"model":"ta_lstm_outage","selected_seed":seed,"model_path":str(path)})
    conversion,equivalence=exp.convert_best_models_to_tfjs(output,Path(__file__).resolve().parents[1],selections)
    exp.write_json(output/"tfjs_conversion.json",conversion)
    result={"publication_eligible":False,"shapes":[[30,5],[30,8]],"equivalence":equivalence}
    exp.write_json(output/"preflight_result.json",result)
    if len(equivalence)!=2 or any(row.get("status")!="completed" for row in equivalence):
        raise RuntimeError("Daily export preflight failed; inspect conversion and equivalence diagnostics")
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--output-dir',type=Path,required=True); a=p.parse_args()
    print(json.dumps(run(a.output_dir),indent=2))
