#!/usr/bin/env python3
"""Run a .jsx inside the open After Effects through the AE-MCP command folder.

usage: ae_run.py script.jsx [config.json]

The config (if given) is injected as a global `CFG` object, then the script is
loaded with $.evalFile. Scripts write their own log file (CFG.work/log_*.txt):
the panel's return value is not reliable.
"""
import json, os, sys, time

CMD_DIR = os.path.expanduser('~/Documents/ae-mcp-commands')


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    script = os.path.abspath(sys.argv[1])
    cfg = json.load(open(sys.argv[2], encoding='utf-8')) if len(sys.argv) > 2 else {}
    src = 'var CFG = %s;\n$.evalFile(new File(%s));\ntrue;' % (
        json.dumps(cfg, ensure_ascii=False), json.dumps(script, ensure_ascii=False))
    cid = 'cmd_%d_cw' % int(time.time() * 1000)
    path = os.path.join(CMD_DIR, 'client_99_1_%s.json' % cid)
    with open(path + '.tmp', 'w', encoding='utf-8') as f:
        json.dump({'id': cid, 'script': src, 'timestamp': int(time.time() * 1000)}, f, ensure_ascii=False)
    os.replace(path + '.tmp', path)
    for _ in range(600):
        r = path + '.response'
        if os.path.exists(r):
            print(open(r, encoding='utf-8').read())
            return
        time.sleep(0.5)
    print('TIMEOUT (is the AE-MCP panel open in After Effects?)')


if __name__ == '__main__':
    main()
