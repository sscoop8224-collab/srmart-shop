#!/usr/bin/env node
/**
 * 전달 파일 — 작업 가지 정리 도구는 루트 공용 자리로 옮겼다 (2026-11-16 대표님 지시 2)
 *
 *   진짜 도구: C:/srmart/tools/worktree-cleanup.cjs (세 창이 같이 쓴다 · 루트 저장소에 커밋)
 *   이 파일은 옛 명령(node scripts/worktree-cleanup.cjs …)이 그대로 돌게 인자를 넘기기만 한다.
 *   🔴 여기에 판정을 다시 적지 마라 — 사본이 생기면 두 판정이 갈라진다.
 */
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const TOOL = 'C:/srmart/tools/worktree-cleanup.cjs';
if (!fs.existsSync(TOOL)) {
  console.error(`🔴 공용 정리 도구가 없습니다: ${TOOL} — 루트 저장소(C:/srmart)를 확인하세요. 손으로 치우지 마세요(링크가 든 폴더를 옮기면 원본 node_modules 가 비워집니다).`);
  process.exit(1);
}
const r = spawnSync(process.execPath, [TOOL, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
