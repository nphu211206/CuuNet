"""Replay each fitted Binh Lieu model under the original frozen-input protocol."""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from binh_lieu_neural import config_and_frame
from outage_revision_experiments import frozen_neural
import revision_experiments as forecast


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--daily",type=Path,required=True)
    parser.add_argument("--fits",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    manifest,zone,frame,features=config_and_frame(args.daily)
    tests=frame.loc[frame.index>pd.Timestamp(manifest["splits"]["validation_end"])].index
    horizons=manifest["outage_horizons"]
    origins=tests[::manifest["outage_origin_stride"]]-pd.Timedelta(days=1)
    origins=origins[origins+pd.Timedelta(days=max(horizons))<=frame.index[-1]]
    assert len(origins)==208
    tf=forecast.tf
    tf.config.set_visible_devices([], "GPU")
    tf.config.threading.set_intra_op_parallelism_threads(2)
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.experimental.enable_op_determinism()
    arrays=forecast.prepare_neural_arrays(frame,features,zone["target_column"],manifest["splits"],
               manifest["lookback"],zone["fixed_range_features"])
    bounds=forecast.resolve_prediction_bounds(manifest)
    ordinary=[]
    records=[]
    for seed in manifest["training"]["seeds"]:
        result=args.fits/str(seed)
        predictions=pd.read_csv(result/"neural_predictions.csv")
        assert set(predictions.seed)=={seed}
        ordinary.append(predictions)
        for name in ("ta_lstm","lstm_no_attention","ta_lstm_outage"):
            path=result/"models"/zone["id"]/f"{name}_seed_{seed}.keras"
            model=forecast.keras.models.load_model(path,compile=False)
            def predict(batch):
                return np.concatenate([model(batch[i:i+256],training=False).numpy().reshape(-1)
                                       for i in range(0,len(batch),256)])
            replay=frozen_neural(frame,features,zone["target_column"],origins,horizons,manifest["lookback"],
                   arrays["feature_scaler"],arrays["target_scaler"],predict,"D",bounds,zone["target_input_column"],
                   zone["availability_feature_columns"],zone["age_feature_column"],
                   manifest["outage_max_gap"],manifest["outage_input_policy"])
            for h,predicted in replay.items():
                verify=frame.loc[origins+pd.Timedelta(days=h),zone["target_column"]]
                records.append(pd.DataFrame({"model":name,"seed":seed,"horizon":h,"origin":origins,
                    "target_date":verify.index,"observed":verify.to_numpy(),"predicted":predicted}))
            forecast.keras.backend.clear_session()

    args.out.mkdir(parents=True,exist_ok=True)
    ordinary=pd.concat(ordinary)
    outage=pd.concat(records)
    assert ordinary.groupby(["model","seed","split"]).size().unique().tolist()==[1461,1096]
    assert len(outage)==3*5*3*208
    ordinary.to_csv(args.out/"neural_ordinary.csv",index=False,lineterminator="\n")
    outage.to_csv(args.out/"neural_outage.csv",index=False,lineterminator="\n")
    print("Saved the 15 models' ordinary and frozen-input predictions.",flush=True)


if __name__=="__main__":
    main()
