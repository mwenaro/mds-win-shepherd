import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentUrl, path } = body;

    if (!agentUrl || !path) {
      return NextResponse.json(
        { success: false, error: 'Agent URL and program path are required' },
        { status: 400 }
      );
    }

    // Forward request to agent
    const response = await fetch(`${agentUrl}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error starting program on agent:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}