param(
    [string]$TaskRoot = 'E:\Luu_Tru_O_C\CuuNet\analysis\final_revision_20261125\task4_5_english'
)
$ErrorActionPreference = 'Stop'
$trackingInput = Join-Path $TaskRoot 'staged\HYDRO_D_26_00188_TrackedChanges.docx'
$trackingProof = Join-Path $TaskRoot 'qa_word\tracked_for_acceptance_proof.docx'
$trackingAccepted = Join-Path $TaskRoot 'qa_word\accepted_repaired_by_word.docx'
Copy-Item -LiteralPath $trackingInput -Destination $trackingProof -Force
$trackingHash = (Get-FileHash -LiteralPath $trackingInput -Algorithm SHA256).Hash.ToLowerInvariant()
$trackingApp = $null
$trackingDocument = $null
try {
    $trackingApp = New-Object -ComObject Word.Application
    $trackingApp.Visible = $false
    $trackingApp.DisplayAlerts = 0
    $trackingDocument = $trackingApp.Documents.Open($trackingProof, $false, $false)
    $trackingCountBefore = $trackingDocument.Revisions.Count
    $trackingDocument.Revisions.AcceptAll()
    $trackingDocument.TrackRevisions = $false
    $trackingCountAfter = $trackingDocument.Revisions.Count
    if ($trackingCountAfter -ne 0) { throw 'Word did not accept every revision.' }
    $trackingDocument.SaveAs2($trackingAccepted, 16)
    if ((Get-FileHash -LiteralPath $trackingInput -Algorithm SHA256).Hash.ToLowerInvariant() -ne $trackingHash) {
        throw 'The tracked input changed during acceptance proof.'
    }
    $trackingRecord = [ordered]@{
        tracked = $trackingInput
        tracked_sha256 = $trackingHash
        actual_acceptance_engine = 'Microsoft Word Revisions.AcceptAll'
        revisions_before = $trackingCountBefore
        revisions_after = $trackingCountAfter
        accepted = $trackingAccepted
        tracked_input_unchanged = $true
    }
    $trackingRecord | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $TaskRoot 'word_acceptance_proof_en.json') -Encoding utf8
    $trackingRecord | ConvertTo-Json
}
finally {
    if ($null -ne $trackingDocument) {
        try { $trackingDocument.Close(0) } catch { }
        [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($trackingDocument)
    }
    if ($null -ne $trackingApp) {
        try { $trackingApp.Quit(0) } catch { }
        [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($trackingApp)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
