import subprocess
import os
import ctypes

os.chdir(r"E:\projects\flux")

log = []
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    out = (r.stdout + r.stderr).strip()
    log.append(f"> {cmd}\n{out}")
    return r.returncode, out

rc, out = run("git pull --rebase origin master")
log.append(f"[rebase rc={rc}]")

if rc == 0:
    rc2, out2 = run("git push origin master")
    log.append(f"[push rc={rc2}]")
    msg = "\n".join(log)
    if rc2 == 0:
        ctypes.windll.user32.MessageBoxW(0, msg, "Push SUCCESS", 0x40)
    else:
        ctypes.windll.user32.MessageBoxW(0, msg, "Push FAILED", 0x10)
else:
    msg = "\n".join(log)
    ctypes.windll.user32.MessageBoxW(0, msg, "Rebase FAILED", 0x10)

with open(r"E:\projects\flux\push_log.txt", "w") as f:
    f.write("\n".join(log))
