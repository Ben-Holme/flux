Set oShell = CreateObject("WScript.Shell")
Set oExec = oShell.Exec("cmd /c cd /d E:\projects\flux && git pull --rebase origin master && git push origin master 2>&1")
output = ""
Do While Not oExec.StdOut.AtEndOfStream
    output = output & oExec.StdOut.ReadLine() & vbCrLf
Loop
rc = oExec.ExitCode
If rc = 0 Then
    MsgBox "SUCCESS!" & vbCrLf & vbCrLf & output, 64, "Git Push"
Else
    MsgBox "FAILED (rc=" & rc & ")" & vbCrLf & vbCrLf & output, 16, "Git Push"
End If
