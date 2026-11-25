param(
    [string]$TaskRoot = 'E:\Luu_Tru_O_C\CuuNet\analysis\final_revision_20261125\task4_5_english'
)
$ErrorActionPreference = 'Stop'
$revisionSource = Join-Path $TaskRoot 'source_backup_20261125\HYDRO_D_26_00188_Revision1_Clean.docx'
$revisionClean = Join-Path $TaskRoot 'staged\HYDRO_D_26_00188_Revision1_Clean.docx'
$revisionTracked = Join-Path $TaskRoot 'staged\HYDRO_D_26_00188_TrackedChanges.docx'
$revisionProofDir = Join-Path $TaskRoot 'qa_word'
New-Item -ItemType Directory -Path $revisionProofDir -Force | Out-Null
$revisionAuthored = Join-Path $revisionProofDir 'authored_clean_before_word.docx'
$revisionAccepted = Join-Path $revisionProofDir 'accepted_by_microsoft_word.docx'
Copy-Item -LiteralPath $revisionClean -Destination $revisionAuthored -Force
$sourceHashBefore = (Get-FileHash -LiteralPath $revisionSource -Algorithm SHA256).Hash.ToLowerInvariant()
$wordRevisionApp = $null
$wordOriginal = $null
$wordRevised = $null
$wordCompared = $null
try {
    $wordRevisionApp = New-Object -ComObject Word.Application
    $wordRevisionApp.Visible = $false
    $wordRevisionApp.DisplayAlerts = 0
    $wordOriginal = $wordRevisionApp.Documents.Open($revisionSource, $false, $true)
    $wordRevised = $wordRevisionApp.Documents.Open($revisionAuthored, $false, $true)
    $wordCompared = $wordRevisionApp.CompareDocuments(
        $wordOriginal, $wordRevised, 2, 1,
        $true, $true, $true, $true, $true, $true, $true, $true, $true, $false,
        'Codex', $true
    )
    $revisionCount = $wordCompared.Revisions.Count
    if ($revisionCount -lt 1) { throw 'Word comparison produced no revisions.' }
    $wordCompared.TrackRevisions = $true
    $wordCompared.SaveAs2($revisionTracked, 16)
    $wordCompared.Revisions.AcceptAll()
    $wordCompared.TrackRevisions = $false
    $remainingRevisions = $wordCompared.Revisions.Count
    if ($remainingRevisions -ne 0) { throw 'Word Accept All left revisions in the document.' }
    $wordCompared.SaveAs2($revisionAccepted, 16)
    $sourceHashAfter = (Get-FileHash -LiteralPath $revisionSource -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($sourceHashAfter -ne $sourceHashBefore) { throw 'The comparison source changed.' }
    $revisionRecord = [ordered]@{
        source = $revisionSource
        source_sha256 = $sourceHashBefore
        source_date = '22 November 2026'
        source_is_confirmed_initial_journal_submission = $false
        comparison_engine = 'Microsoft Word native CompareDocuments'
        word_version = $wordRevisionApp.Version
        comparison_granularity = 'word'
        compare_formatting_tables_headers_fields_and_comments = $true
        compare_moves = $false
        revisions = $revisionCount
        accepted_with = 'Microsoft Word Revisions.AcceptAll'
        remaining_revisions_after_acceptance = $remainingRevisions
        authored_clean = $revisionAuthored
        tracked = $revisionTracked
        accepted = $revisionAccepted
        source_unchanged = $true
        experiments_rerun = $false
    }
    $revisionRecord | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $TaskRoot 'tracked_basis_en.json') -Encoding utf8
    $revisionRecord | ConvertTo-Json -Depth 6
}
finally {
    foreach ($wordRevisionDocument in @($wordCompared, $wordRevised, $wordOriginal)) {
        if ($null -ne $wordRevisionDocument) {
            try { $wordRevisionDocument.Close(0) } catch { }
            [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordRevisionDocument)
        }
    }
    if ($null -ne $wordRevisionApp) {
        try { $wordRevisionApp.Quit(0) } catch { }
        [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordRevisionApp)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
