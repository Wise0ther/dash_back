Attribute VB_Name = "modCodeLog"
Option Explicit

' ============================================================
' NASTROYKI STRUKTURY LISTA
' ============================================================

' Stolbec s timestamp.
' A = 1
Private Const TIMESTAMP_COLUMN As Long = 1

' Stolbec s kodom.
' B = 2
Private Const CODE_COLUMN As Long = 2


' ============================================================
' APPEND CODE LOG
'
' Vyzyvaetsya iz Worksheet_Change posle togo,
' kak timestamp uzhe zapisan v stolbec A.
'
' Edinyy format CSV:
'
' Timestamp;Event;Code;User;SessionID
'
' Primer:
'
' 2026-09-19 23:51:11;CODE;ABC123;aboba;aboba_20260919-235111
' ============================================================

Public Sub AppendCodeLog(ByVal changedCell As Range)

    Dim ws As Worksheet

    Dim codeValue As String
    Dim timeValue As Variant

    Dim userName As String
    Dim fileNumber As Integer

    On Error GoTo WriteError

    Set ws = changedCell.Worksheet


    ' --------------------------------------------------------
    ' POLUCHAEM KOD
    ' --------------------------------------------------------

    codeValue = CStr( _
        ws.Cells(changedCell.Row, CODE_COLUMN).Value2 _
    )

    If Len(Trim$(codeValue)) = 0 Then
        Exit Sub
    End If


    ' --------------------------------------------------------
    ' POLUCHAEM TIMESTAMP IZ TABLICY
    ' --------------------------------------------------------

    timeValue = _
        ws.Cells(changedCell.Row, TIMESTAMP_COLUMN).Value

    If Not IsDate(timeValue) Then
        Exit Sub
    End If


    ' --------------------------------------------------------
    ' USER
    ' --------------------------------------------------------

    userName = Environ$("USERNAME")


    ' --------------------------------------------------------
    ' SESSION ID
    '
    ' Dolzhna byt sozdana pri Workbook_Open.
    '
    ' Esli VBA byl sbroshen ili Workbook_Open
    ' po kakoy-to prichine ne srabotal,
    ' sozdaem novuyu session.
    ' --------------------------------------------------------

    If Len(CurrentSessionID) = 0 Then
        StartWorkbookSession
    End If


    ' --------------------------------------------------------
    ' PROVERKA LOG-FAYLA
    ' --------------------------------------------------------

    EnsureLogFileExists


    ' --------------------------------------------------------
    ' APPEND V CSV
    ' --------------------------------------------------------

    fileNumber = FreeFile

    Open LOG_FILE_PATH For Append As #fileNumber

    Print #fileNumber, _
        Format$(CDate(timeValue), "yyyy-mm-dd HH:nn:ss") & ";" & _
        "CODE;" & _
        codeValue & ";" & _
        userName & ";" & _
        CurrentSessionID

    Close #fileNumber

    Exit Sub


WriteError:

    ' Oshibka loga ne dolzhna ostanavlivat rabotu operatora.
    On Error Resume Next

    If fileNumber > 0 Then
        Close #fileNumber
    End If

    On Error GoTo 0

End Sub

