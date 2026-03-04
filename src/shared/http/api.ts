import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 201, ...init });
}

export function fail(message: string, status = 400, details?: any) {
  return NextResponse.json({ ok: false, message, details }, { status });
}