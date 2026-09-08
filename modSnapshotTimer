Option Explicit

' ============================================================
' OnTime timer dlya snapshot
'
' Snapshot sozdaetsya:
'   - srazu pri starte;
'   - zatem po rovnoy 5-minutnoy setke.
'
' Primer:
'   09:30
'   09:35
'   09:40
' ============================================================

Private Const SNAPSHOT_INTERVAL_MINUTES As Long = 5

Private NextSnapshotTime As Date
Private TimerIsRunning As Boolean


' ============================================================
' Zapusk taymera
' ============================================================

Public Sub StartSnapshotTimer()

    If TimerIsRunning Then
        Exit Sub
    End If

    TimerIsRunning = True

    ' Snapshot srazu posle starta.
    ExportDashboardData

    ' Planiruem sleduyuschiy.
    ScheduleNextSnapshot

End Sub


' ============================================================
' Vyzyvaetsya Application.OnTime
' ============================================================

Public Sub SnapshotTimerTick()

    If Not TimerIsRunning Then
        Exit Sub
    End If

    ExportDashboardData

    ScheduleNextSnapshot

End Sub


' ============================================================
' Raschet sleduyuschey rovnoy 5-minutnoy otmetki
' ============================================================

Private Sub ScheduleNextSnapshot()

    Dim currentTime As Date
    Dim baseTime As Date
    Dim nextMinute As Long

    If Not TimerIsRunning Then
        Exit Sub
    End If

    currentTime = Now

    nextMinute = _
        ((Minute(currentTime) \ SNAPSHOT_INTERVAL_MINUTES) + 1) _
        * SNAPSHOT_INTERVAL_MINUTES

    baseTime = DateSerial( _
        Year(currentTime), _
        Month(currentTime), _
        Day(currentTime) _
    )

    If nextMinute >= 60 Then

        NextSnapshotTime = _
            baseTime + _
            TimeSerial(Hour(currentTime) + 1, 0, 0)

    Else

        NextSnapshotTime = _
            baseTime + _
            TimeSerial(Hour(currentTime), nextMinute, 0)

    End If

    Application.OnTime _
        EarliestTime:=NextSnapshotTime, _
        Procedure:="SnapshotTimerTick", _
        Schedule:=True

End Sub


' ============================================================
' Ostanovka taymera
'
' Otmenyaem uzhe zaplanirovannyy OnTime.
' ============================================================

Public Sub StopSnapshotTimer()

    On Error Resume Next

    TimerIsRunning = False

    If NextSnapshotTime <> 0 Then

        Application.OnTime _
            EarliestTime:=NextSnapshotTime, _
            Procedure:="SnapshotTimerTick", _
            Schedule:=False

    End If

    NextSnapshotTime = 0

    On Error GoTo 0

End Sub
