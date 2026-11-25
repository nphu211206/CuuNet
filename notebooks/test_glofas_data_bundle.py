"""CPU-only checks for portable acquisition state and archive integrity."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
import glofas_data_bundle as bundle
import prepare_glofas_revision_data as preparation


class DataBundleTests(unittest.TestCase):
    def setUp(self):
        parent = Path(__file__).resolve().parents[1] / 'analysis/glofas_bundle_test_tmp'
        parent.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(dir=parent)
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.source = self.base/'source'
        self.target = self.base/'target'
        for root in (self.source,self.target):
            (root/'data').mkdir(parents=True)
            (root/'data/source_manifest.glofas.verified.json').write_text('{"fixture":true}')
        self.raw = self.source/'data/glofas_revision/raw'
        self.raw.mkdir(parents=True)

    def rewrite(self, archive, replace_name, data):
        with zipfile.ZipFile(archive) as incoming:
            files = {name:incoming.read(name) for name in incoming.namelist()}
        files[replace_name] = data
        with zipfile.ZipFile(archive,'w') as outgoing:
            for name,value in files.items(): outgoing.writestr(name,value)

    def test_checkpoint_preserves_existing_uuid_and_excludes_credentials_and_partial_files(self):
        request_id = '30c75b54-8d44-4d31-aae9-0ab722e0722b'
        preparation.register_adoptions(self.raw,[f'Bao_Ha_Reach:2000:{request_id}'])
        (self.raw/'fixture.partial').write_text('incomplete')
        (self.source/'.cdsapirc').write_text('key: fixture-private-token')
        archive = self.source/'checkpoint.zip'
        context = bundle.export_bundle(self.source,archive,metadata_only=True)
        self.assertEqual(len(context['files']),1)
        bundle.import_bundle(self.target,archive)
        journal = next((self.target/'data/glofas_revision/raw').glob('*.job.json'))
        self.assertEqual(json.loads(journal.read_text())['request_id'],request_id)
        with zipfile.ZipFile(archive) as zipped:
            self.assertNotIn(b'fixture-private-token',b''.join(zipped.read(name) for name in zipped.namelist()))

    def test_hash_failure_does_not_write_any_member(self):
        (self.raw/'a.zip').write_bytes(b'first fixture')
        (self.raw/'z.zip').write_bytes(b'second fixture')
        archive = self.source/'data.zip'
        bundle.export_bundle(self.source,archive)
        self.rewrite(archive,'data/glofas_revision/raw/z.zip',b'tampered')
        with self.assertRaisesRegex(ValueError,'hash|byte count'):
            bundle.import_bundle(self.target,archive)
        self.assertFalse((self.target/'data/glofas_revision/raw/a.zip').exists())

    def test_declared_path_traversal_is_rejected_without_writing(self):
        archive = self.source/'attack.zip'
        payload = b'outside'
        context = {'format':bundle.FORMAT,'metadata_only':True,'source_manifest_sha256':None,
                   'files':{'data/glofas_revision/../../../outside.txt':{
                       'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()}}}
        with zipfile.ZipFile(archive,'w') as zipped:
            zipped.writestr('glofas_bundle_manifest.json',json.dumps(context))
            zipped.writestr('data/glofas_revision/../../../outside.txt',payload)
        with self.assertRaisesRegex(ValueError,'Disallowed'):
            bundle.import_bundle(self.target,archive)
        self.assertFalse((self.base/'outside.txt').exists())

    def test_older_checkpoint_keeps_newer_matching_local_job_state(self):
        request_id = '30c75b54-8d44-4d31-aae9-0ab722e0722b'
        preparation.register_adoptions(self.raw,[f'Bao_Ha_Reach:2000:{request_id}'])
        archive = self.source/'checkpoint.zip'
        bundle.export_bundle(self.source,archive,metadata_only=True)
        bundle.import_bundle(self.target,archive)
        journal = next((self.target/'data/glofas_revision/raw').glob('*.job.json'))
        job = json.loads(journal.read_text())
        job['state'] = 'downloaded'
        journal.write_text(json.dumps(job))
        bundle.import_bundle(self.target,archive)
        self.assertEqual(json.loads(journal.read_text())['state'],'downloaded')


if __name__ == '__main__':
    unittest.main(verbosity=2)
