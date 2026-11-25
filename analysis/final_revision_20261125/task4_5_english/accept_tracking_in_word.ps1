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
    $referenceHeadingAlignment = $null
    $referenceEntryAlignments = @()
    $referenceHeadingIndex = 0
    for ($paragraphIndex = 1; $paragraphIndex -le $trackingDocument.Paragraphs.Count; $paragraphIndex++) {
        if ($trackingDocument.Paragraphs.Item($paragraphIndex).Range.Text.Trim() -eq 'References') {
            $referenceHeadingIndex = $paragraphIndex
            $referenceHeadingAlignment = $trackingDocument.Paragraphs.Item($paragraphIndex).Format.Alignment
            break
        }
    }
    if ($referenceHeadingIndex -eq 0) { throw 'References heading was not found.' }
    for ($paragraphIndex = $referenceHeadingIndex + 1; $paragraphIndex -le $trackingDocument.Paragraphs.Count; $paragraphIndex++) {
        $referenceText = $trackingDocument.Paragraphs.Item($paragraphIndex).Range.Text.Trim()
        if ($referenceText -and $referenceEntryAlignments.Count -lt 25) {
            $referenceEntryAlignments += $trackingDocument.Paragraphs.Item($paragraphIndex).Format.Alignment
        }
        if ($referenceEntryAlignments.Count -eq 25) { break }
    }
    if ($referenceHeadingAlignment -ne 0 -or $referenceEntryAlignments.Count -ne 25 -or
        @($referenceEntryAlignments | Where-Object { $_ -ne 0 }).Count -gt 0) {
        throw 'References alignment is not Word LEFT (0).'
    }
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
        references_heading_alignment_word = $referenceHeadingAlignment
        reference_entry_alignments_word = $referenceEntryAlignments
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
