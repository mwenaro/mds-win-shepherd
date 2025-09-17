import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentUrl = searchParams.get('agentUrl');

    if (!agentUrl) {
      return NextResponse.json(
        { success: false, error: 'Agent URL is required' },
        { status: 400 }
      );
    }

    // Forward request to agent
    const response = await fetch(`${agentUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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