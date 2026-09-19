Attribute VB_Name = "modWorkbookLog"
Option Explicit

' ============================================================
' NASTROYKI
' ============================================================

Public Const LOG_FILE_PATH As String = _
    "C:\Users\aboba\Documents\DEV\2. VBA\excel-dashboard\workbook_log.csv"


' ============================================================
' TEKUSCHAYA SESSION
'
' Sozdaetsya odin raz pri otkrytii knigi.
'
' Primer:
' aboba_20260919-235111
' ============================================================

Public CurrentSessionID As String


' ============================================================
' START SESSION
'
' Vyzyvaetsya iz Workbook_Open.
' ============================================================

Public Sub StartWorkbookSession()

    Dim userName As String

    userName = Environ$("USERNAME")

    CurrentSessionID = _
        userName & "_" & _
        Format$(Now, "yyyymmdd-HHnnss")

    WriteWorkbookEvent "OPEN"

End Sub


' ============================================================
' END SESSION
'
' Vyzyvaetsya iz Workbook_BeforeClose.
' ============================================================

Public Sub EndWorkbookSession()

    WriteWorkbookEvent "CLOSE"

End Sub


' ============================================================
' ZAPIS OPEN / CLOSE
'
' Edinyy format CSV:
'
' Timestamp;Event;Code;User;SessionID
'
' Primer:
'
' 2026-09-19 23:51:11;OPEN;;aboba;aboba_20260919-235111
' ============================================================

Private Sub WriteWorkbookEvent(ByVal eventName As String)

    Dim fileNumber As Integer
    Dim userName As String

    On Error GoTo WriteError

    userName = Environ$("USERNAME")

    ' Esli fayla esche net - sozdaem ego s zagolovkom.
    EnsureLogFileExists

    fileNumber = FreeFile

    Open LOG_FILE_PATH For Append As #fileNumber

    Print #fileNumber, _
        Format$(Now, "yyyy-mm-dd HH:nn:ss") & ";" & _
        eventName & ";" & _
        ";" & _
        userName & ";" & _
        CurrentSessionID

    Close #fileNumber

    Exit Sub


WriteError:

    ' Oshibka loga ne dolzhna meshàòü rabote knigi.
    On Error Resume Next

    If fileNumber > 0 Then
        Close #fileNumber
    End If

    On Error GoTo 0

End Sub


' ============================================================
' SOZDANIE LOG-FAYLA
'
' Esli fayla net, sozdaem ego i zapisivaem zagolovok.
'
' Esli fayl uzhe est, nichego ne delaem.
' ============================================================

Public Sub EnsureLogFileExists()

    Dim fileNumber As Integer

    On Error GoTo CreateError

    If Len(Dir$(LOG_FILE_PATH)) > 0 Then
        Exit Sub
    End If

    fileNumber = FreeFile

    Open LOG_FILE_PATH For Output As #fileNumber

    Print #fileNumber, _
        "Timestamp;Event;Code;User;SessionID"

    Close #fileNumber

    Exit Sub


CreateError:

    On Error Resume Next

    If fileNumber > 0 Then
        Close #fileNumber
    End If

    On Error GoTo 0

End Sub

