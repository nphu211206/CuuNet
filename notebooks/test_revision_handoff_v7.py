import hashlib,json,tempfile,unittest,zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock,patch
import numpy as np
import revision_experiments as exp
import tfjs_daily_preflight as preflight

class HandoffTests(unittest.TestCase):
 def test_checkpoint_rejects_wrong_source_or_changed_weights(self):
  with tempfile.TemporaryDirectory() as folder:
   model=Path(folder)/'m.keras'; model.write_bytes(b'checked model')
   state={'training_signature':'a','model_sha256':hashlib.sha256(model.read_bytes()).hexdigest(),'history':{'val_mae':[.2]}}
   model.with_suffix('.history.json').write_text(json.dumps(state))
   self.assertEqual(exp.checked_model_checkpoint(model,'a'),state)
   with self.assertRaisesRegex(ValueError,'protocol'): exp.checked_model_checkpoint(model,'b')
   model.write_bytes(b'changed')
   with self.assertRaisesRegex(ValueError,'hash mismatch'): exp.checked_model_checkpoint(model,'a')
 def test_partial_zip_is_labelled_and_every_file_is_checked(self):
  with tempfile.TemporaryDirectory() as folder:
   output=Path(folder)/'run'; output.mkdir(); (output/'source.txt').write_text('source')
   archive=exp.save_training_checkpoint(output)
   with zipfile.ZipFile(archive) as zipped:
    record=json.loads(zipped.read('checkpoint_manifest.json'))
    self.assertFalse(record['publication_eligible'])
    for name,digest in record['files'].items(): self.assertEqual(hashlib.sha256(zipped.read(name)).hexdigest(),digest)

class PreflightMetadataTests(unittest.TestCase):
 def test_converter_and_node_cases_receive_the_actual_seed(self):
  class FakeModel:
   def __call__(self, inputs, training=False):
    return np.zeros((len(inputs),1),dtype=np.float32)
   def save(self,path):
    path.write_bytes(b'mocked compatibility model')
  def consume(output,root,selections):
   self.assertEqual([int(row['selected_seed']) for row in selections],[47,50])
   rows=[]
   for row in selections:
    case=json.loads((output/'tfjs_equivalence_cases'/(row['zone']+'.json')).read_text())
    self.assertEqual(case['selected_seed'],row['selected_seed'])
    self.assertEqual(case['model'],row['model'])
    self.assertTrue(Path(row['model_path']).is_file())
    self.assertFalse(case['publication_eligible'])
    rows.append({'zone':row['zone'],'status':'completed'})
   return [],rows
  backend=SimpleNamespace(clear_session=Mock())
  with tempfile.TemporaryDirectory() as folder, \
       patch.object(exp,'tf',object()), \
       patch.object(exp,'keras',SimpleNamespace(backend=backend)), \
       patch.object(exp,'set_seed') as seed_mock, \
       patch.object(exp,'build_neural_model',return_value=FakeModel()), \
       patch.object(exp,'convert_best_models_to_tfjs',side_effect=consume) as converter_mock:
   result=preflight.run(Path(folder))
   self.assertEqual([call.args[0] for call in seed_mock.call_args_list],[47,50])
   self.assertEqual(converter_mock.call_count,1)
   self.assertFalse(result['publication_eligible'])
   self.assertEqual(result['shapes'],[[30,5],[30,8]])

if __name__=='__main__': unittest.main()
