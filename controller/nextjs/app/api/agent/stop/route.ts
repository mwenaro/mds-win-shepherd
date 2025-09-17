import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentUrl, name } = body;

    if (!agentUrl || !name) {
      return NextResponse.json(
        { success: false, error: 'Agent URL and program name are required' },
        { status: 400 }
      );
    }

    // Forward request to agent
    const response = await fetch(`${agentUrl}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}