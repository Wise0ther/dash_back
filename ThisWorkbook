Option Explicit

' ============================================================
' Avtomaticheskiy zapusk taymera pri otkrytii knigi
' ============================================================

Private Sub Workbook_Open()

    On Error Resume Next

    StartSnapshotTimer

    On Error GoTo 0

End Sub


' ============================================================
' Ostanovka taymera pered zakrytiem knigi
' ============================================================

Private Sub Workbook_BeforeClose(Cancel As Boolean)

    On Error Resume Next

    StopSnapshotTimer

    On Error GoTo 0

End Sub
