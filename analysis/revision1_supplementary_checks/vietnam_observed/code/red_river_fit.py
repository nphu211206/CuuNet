"""Compare 2016 one-day discharge forecasts on a common Red River chronology."""
from hashlib import sha256
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from iowa_precipitation_check import fit_and_predict
import revision_experiments as forecast


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--daily",type=Path,required=True)
    parser.add_argument("--seed",type=int,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    manifest=json.loads(Path("data/runoff_revision/experiment_manifest.json").read_text(encoding="utf-8"))
    manifest["splits"]={"train_start":"2000-01-01","train_end":"2008-12-31","validation_end":"2013-12-31","test_end":"2016-12-31"}
    assert args.seed in manifest["training"]["seeds"]
    daily=pd.read_csv(args.daily,parse_dates=["date"]).set_index("date")
    tf=forecast.tf
    tf.config.set_visible_devices([], "GPU")
    tf.config.threading.set_intra_op_parallelism_threads(2)
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.experimental.enable_op_determinism()
    summaries, predictions = [], []
    for station in daily:
        q=daily[station]
        frame=pd.DataFrame({"q":q,"q_input":q.ffill()},index=q.index)
        phase=(frame.index.dayofyear-1)/np.where(frame.index.is_leap_year,366,365)
        frame["annual_sin"]=np.sin(2*np.pi*phase)
        frame["annual_cos"]=np.cos(2*np.pi*phase)
        names=["q_input","annual_sin","annual_cos"]
        arrays=forecast.prepare_neural_arrays(frame,names,"q",manifest["splits"],manifest["lookback"])
        # No window may bridge the omitted 2009–2010 source blocks at the
        # start of validation. The provider's 2015 Q supports 2016 origins.
        for part, mask in (("validation", arrays["validation_dates"]>=pd.Timestamp("2011-01-31")),
                           ("test", arrays["test_dates"].year==2016)):
            for key in (f"x_{part}", f"y_{part}", f"{part}_dates"):
                arrays[key]=arrays[key][mask]
        assert len(arrays["test_dates"])==366 and len(arrays["validation_dates"])==1066 and len(arrays["y_train"])==3258
        print("Training",station,args.seed,flush=True)
        values,epochs,best=fit_and_predict(arrays,manifest,args.seed)
        dates=arrays["test_dates"]
        actual=q.loc[dates]
        predictions.append(pd.DataFrame({"station":station,"seed":args.seed,"actual":actual,"predicted":values}))
        summaries.append({"station":station,"seed":args.seed,"epochs":epochs,"best_epoch":best,
                          "mae":float((actual-values).abs().mean())})
        print("Finished",station,args.seed,"MAE",round(summaries[-1]["mae"],3),flush=True)
    args.out.mkdir(parents=True,exist_ok=True)
    pd.concat(predictions).to_csv(args.out/f"red_seed_{args.seed}.csv",index_label="date",lineterminator="\n")
    forecast.write_json(args.out/f"red_seed_{args.seed}.json",{
        "daily_sha256":sha256(args.daily.read_bytes()).hexdigest(),"metrics":summaries,"training":manifest["training"],
        "features":["lagged discharge","annual sine","annual cosine"],
        "tensorflow":tf.__version__,"keras":forecast.keras.__version__,
    })


if __name__=="__main__":
    main()
