VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit

' ============================================================
' Otkrytie knigi
' ============================================================

Private Sub Workbook_Open()

    ' Registriruem novuyu session.
    On Error Resume Next
    StartWorkbookSession
    On Error GoTo 0

    ' Zapuskaem snapshot timer.
    On Error Resume Next
    StartSnapshotTimer
    On Error GoTo 0

End Sub


' ============================================================
' Zakrytie knigi
' ============================================================

Private Sub Workbook_BeforeClose(Cancel As Boolean)

    ' Ostanavlivaem snapshot timer.
    On Error Resume Next
    StopSnapshotTimer
    On Error GoTo 0

    ' Registriruem normalnoe zakrytie session.
    On Error Resume Next
    EndWorkbookSession
    On Error GoTo 0

End Sub
