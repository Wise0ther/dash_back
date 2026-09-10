Attribute VB_Name = "modSnapshotExport"
Option Explicit

' ============================================================
' Modul eksporta snapshot dlya dashboard
'
' Eksport:
'   - tolko stolbcy A i B;
'   - tolko dannye za poslednie 24 chasa;
'   - pustye A ili B ignoriruyutsya;
'   - JS sozdaetsya zanovo;
'   - staryy fayl zamenyaetsya tolko posle uspeshnoy zapisi.
'
' Nastroiki istochnika zadayutsya tolko v etom bloke.
'
' EXPORT_SHEET_NAME:
'   imya lista Excel, iz kotorogo berutsya dannye.
'
' EXPORT_FOLDER_PATH:
'   papka, v kotoruyu budet zapisan JS fayl.
'   Put dolzhen zakanchivatsya simvolom "\".
'
' EXPORT_DATA_NAME:
'   edinoe imya istochnika.
'
' Trebovaniya k EXPORT_DATA_NAME:
'   - dolzhno nachinatsya s latinskoy bukvy;
'   - mozhno ispolzovat latinskie bukvy i cifry;
'   - bez probelov;
'   - bez defisov, tochek i drugih specsimvolov.
'
' Primer:
'
' EXPORT_DATA_NAME = "Production"
'
' Fayl:
'   Production.js
'
' Dannye v fayle:
'
' window.ProductionData = {
'   generatedAt: "2026-09-09T18:40:00",
'   rows: [
'     ["2026-09-09T17:01:11", "ABC123"],
'     ["2026-09-09T17:02:25", "ABC124"]
'   ]
' };
' ============================================================


Private Const EXPORT_SHEET_NAME As String = "Sheet1"

Private Const EXPORT_FOLDER_PATH As String = _
    "C:\Users\user\Documents\data\"

Private Const EXPORT_DATA_NAME As String = "Test217"

Private Const FIRST_DATA_ROW As Long = 2


' ============================================================
' Glavnaya procedura eksporta
' ============================================================

Public Sub ExportDashboardData()

    Dim ws As Worksheet

    Dim exportTime As Date
    Dim cutoffTime As Date

    Dim lastRow As Long
    Dim firstExportRow As Long

    Dim exportFilePath As String
    Dim tempFilePath As String

    On Error GoTo ExportError

    Set ws = ThisWorkbook.Worksheets(EXPORT_SHEET_NAME)

    ' Formiruem polnyy put k JS faylu.
    exportFilePath = _
        EXPORT_FOLDER_PATH & _
        EXPORT_DATA_NAME & _
        ".js"

    ' Fiksiruem sistemnoe vremya odin raz.
    exportTime = Now

    ' Granica poslednih 24 chasov.
    cutoffTime = exportTime - 1

    ' Ischem poslednyuyu ispolzuemuyu stroku.
    lastRow = GetLastUsedRow(ws)

    If lastRow < FIRST_DATA_ROW Then
        Exit Sub
    End If

    ' Ischem granicu snapshot snizu vverh.
    firstExportRow = FindFirstExportRow( _
        ws:=ws, _
        lastRow:=lastRow, _
        cutoffTime:=cutoffTime _
    )

    ' Vremennyy fayl.
    tempFilePath = exportFilePath & ".tmp"

    ' Snachala polnostyu sozdaem vremennyy JS.
    WriteJsFile _
        ws:=ws, _
        firstRow:=firstExportRow, _
        lastRow:=lastRow, _
        exportTime:=exportTime, _
        filePath:=tempFilePath

    ' Tolko posle uspeshnoy zapisi zamenyaem rabochiy fayl.
    ReplaceFile _
        tempFilePath:=tempFilePath, _
        finalFilePath:=exportFilePath

    Exit Sub


ExportError:

    ' Operatoru MsgBox ne pokazyvaem.

    On Error Resume Next

    If Len(tempFilePath) > 0 Then
        If Len(Dir$(tempFilePath)) > 0 Then
            Kill tempFilePath
        End If
    End If

    On Error GoTo 0

End Sub


' ============================================================
' Poisk posledney ispolzuemoy stroki
'
' Ischem po vsemu listu, a ne tolko po A,
' potomu chto v A mogut byt pustye yacheyki.
' ============================================================

Private Function GetLastUsedRow(ByVal ws As Worksheet) As Long

    Dim lastCell As Range

    Set lastCell = ws.Cells.Find( _
        What:="*", _
        After:=ws.Cells(1, 1), _
        LookAt:=xlPart, _
        LookIn:=xlFormulas, _
        SearchOrder:=xlByRows, _
        SearchDirection:=xlPrevious, _
        MatchCase:=False _
    )

    If lastCell Is Nothing Then
        GetLastUsedRow = 0
    Else
        GetLastUsedRow = lastCell.Row
    End If

End Function


' ============================================================
' Poisk granicy poslednih 24 chasov
'
' Idem snizu vverh.
'
' Pustye A ili B ignoriruyutsya.
'
' Kak tolko naydena validnaya stroka:
'
'     A < cutoffTime
'
' ostanavlivaemsya.
' ============================================================

Private Function FindFirstExportRow( _
    ByVal ws As Worksheet, _
    ByVal lastRow As Long, _
    ByVal cutoffTime As Date _
) As Long

    Dim i As Long
    Dim valueA As Variant
    Dim valueB As Variant

    FindFirstExportRow = FIRST_DATA_ROW

    For i = lastRow To FIRST_DATA_ROW Step -1

        valueA = ws.Cells(i, "A").Value
        valueB = ws.Cells(i, "B").Value2

        If Len(Trim$(CStr(valueA))) > 0 _
           And Len(Trim$(CStr(valueB))) > 0 Then

            If IsDate(valueA) Then

                If CDate(valueA) < cutoffTime Then

                    FindFirstExportRow = i + 1
                    Exit Function

                End If

            End If

        End If

    Next i

End Function


' ============================================================
' Sozdanie JS
'
' Format:
'
' window.<EXPORT_DATA_NAME>Data = {
'   generatedAt: "2026-09-09T18:40:00",
'   rows: [
'     ["2026-09-09T17:01:11", "ABC123"],
'     ["2026-09-09T17:02:25", "ABC124"]
'   ]
' };
'
' Primer pri:
'
' EXPORT_DATA_NAME = "Production"
'
' Rezultat:
'
' window.ProductionData = {
'   ...
' };
' ============================================================

Private Sub WriteJsFile( _
    ByVal ws As Worksheet, _
    ByVal firstRow As Long, _
    ByVal lastRow As Long, _
    ByVal exportTime As Date, _
    ByVal filePath As String _
)

    Dim data As Variant
    Dim fileNumber As Integer

    Dim r As Long
    Dim rowJs As String
    Dim isFirstOutputRow As Boolean

    If firstRow > lastRow Then
        firstRow = lastRow
    End If

    ' Chitaem tolko A:B odnim blokom v pamyat.
    data = ws.Range( _
        ws.Cells(firstRow, "A"), _
        ws.Cells(lastRow, "B") _
    ).Value

    fileNumber = FreeFile

    Open filePath For Output As #fileNumber

    Print #fileNumber, _
        "window." & EXPORT_DATA_NAME & "Data = {"

    Print #fileNumber, _
        "  generatedAt: """ & _
        Format$(exportTime, "yyyy-mm-dd\THH:nn:ss") & _
        ""","

    Print #fileNumber, "  rows: ["

    isFirstOutputRow = True

    For r = 1 To UBound(data, 1)

        If Len(Trim$(CStr(data(r, 1)))) > 0 _
           And Len(Trim$(CStr(data(r, 2)))) > 0 Then

            If IsDate(data(r, 1)) Then

                rowJs = _
                    "    [""" & _
                    Format$(CDate(data(r, 1)), "yyyy-mm-dd\THH:nn:ss") & _
                    """,""" & _
                    EscapeJsString(CStr(data(r, 2))) & _
                    """]"

                If Not isFirstOutputRow Then
                    Print #fileNumber, ","
                End If

                Print #fileNumber, rowJs;

                isFirstOutputRow = False

            End If

        End If

    Next r

    Print #fileNumber, ""
    Print #fileNumber, "  ]"
    Print #fileNumber, "};"

    Close #fileNumber

End Sub


' ============================================================
' Ekranirovanie teksta dlya JavaScript
' ============================================================

Private Function EscapeJsString(ByVal text As String) As String

    text = Replace$(text, "\", "\\")
    text = Replace$(text, """", "\""")
    text = Replace$(text, vbCrLf, "\n")
    text = Replace$(text, vbCr, "\n")
    text = Replace$(text, vbLf, "\n")
    text = Replace$(text, vbTab, "\t")

    EscapeJsString = text

End Function


' ============================================================
' Bezopasnaya zamena fayla
' ============================================================

Private Sub ReplaceFile( _
    ByVal tempFilePath As String, _
    ByVal finalFilePath As String _
)

    If Len(Dir$(finalFilePath)) > 0 Then
        Kill finalFilePath
    End If

    Name tempFilePath As finalFilePath

End Sub

