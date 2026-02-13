/**
 * Device Auth Controller
 *
 * HTTP controller for OAuth 2.0 Device Authorization Grant endpoints.
 * These endpoints enable CLI browser-based authentication.
 */

import { HttpError } from '@oxlayer/foundation-http-kit';
import { DeviceAuthService } from '../services/device-auth.js';
import type { Environment } from '../domain/index.js';

export interface InitiateAuthBody {
  deviceName: string;
  environment: Environment;
  scopes?: string[];
}

export interface PollBody {
  deviceCode: string;
}

export interface ApproveBody {
  userCode: string;
}

/**
 * Controller for device authorization
 */
export class DeviceAuthController {
  constructor(
    private readonly deviceAuthService: DeviceAuthService,
    private readonly getDeveloperId: (request: Request) => string,
    private readonly getOrganizationId: (request: Request) => string
  ) {}

  /**
   * POST /v1/cli/device/code
   *
   * Initiate device authorization flow.
   * CLI calls this to get a device code and user code.
   */
  async initiateDeviceAuth(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as InitiateAuthBody;

      if (!body.deviceName) {
        throw new HttpError(400, 'Missing required field: deviceName');
      }
      if (!body.environment) {
        throw new HttpError(400, 'Missing required field: environment');
      }

      const baseUrl = this.getBaseUrl(request);

      const result = await this.deviceAuthService.initiateDeviceAuth(
        body,
        baseUrl
      );

      return Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * POST /v1/cli/device/poll
   *
   * Poll for token completion.
   * CLI calls this repeatedly until user approves or session expires.
   */
  async pollForToken(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as PollBody;

      if (!body.deviceCode) {
        throw new HttpError(400, 'Missing required field: deviceCode');
      }

      const result = await this.deviceAuthService.pollForToken(body);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      return Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * GET /device
   *
   * Browser verification page.
   * User visits this page to approve the device authorization.
   */
  async showDevicePage(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '';
    const error = url.searchParams.get('error');

    const html = this.renderDevicePage(code, error || null);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  /**
   * POST /v1/cli/device/approve
   *
   * Approve a device authorization.
   * Called by browser after user logs in and confirms approval.
   */
  async approveDevice(request: Request): Promise<Response> {
    try {
      const developerId = this.getDeveloperId(request);
      const organizationId = this.getOrganizationId(request);

      const body = (await request.json()) as ApproveBody;

      if (!body.userCode) {
        throw new HttpError(400, 'Missing required field: userCode');
      }

      await this.deviceAuthService.approveDevice({
        userCode: body.userCode,
        developerId,
        organizationId,
      });

      return Response.json({
        success: true,
        message: 'Device approved successfully',
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Invalid user code') {
        throw new HttpError(404, 'Invalid user code');
      }
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * Get base URL from request
   */
  private getBaseUrl(request: Request): string {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  /**
   * Render device approval page HTML
   */
  private renderDevicePage(userCode: string, error: string | null): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OxLayer - Device Authorization</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1a202c;
      margin-bottom: 24px;
      font-size: 24px;
    }
    .code-display {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 32px;
      font-weight: bold;
      color: #2d3748;
      letter-spacing: 4px;
    }
    .instructions {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #5a67d8;
    }
    .btn:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
    }
    .error {
      background: #fed7d7;
      color: #c53030;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Authorize Device</h1>
    ${error ? `<div class="error">${this.escapeHtml(error)}</div>` : ''}
    <p class="instructions">
      A device is requesting access to your OxLayer account.
      Enter this code in the CLI to complete authorization:
    </p>
    <div class="code-display">${this.escapeHtml(userCode || '---- ----')}</div>
    <p class="instructions">
      After entering the code, the CLI will automatically authenticate.
      This page will be updated once authorization is complete.
    </p>
    <button id="approveBtn" class="btn" onclick="approveDevice()">
      <span class="btn-text">✓ Approve Device</span>
      <span class="spinner"></span>
    </button>
  </div>
  <script>
    const userCode = '${this.escapeHtml(userCode)}';

    async function approveDevice() {
      const btn = document.getElementById('approveBtn');
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        const response = await fetch('/v1/cli/device/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCode })
        });

        if (response.ok) {
          btn.textContent = '✓ Approved!';
          btn.style.background = '#48bb78';

          setTimeout(() => {
            document.querySelector('.container').innerHTML = \`
              <h1>✅ Authorization Complete</h1>
              <p class="instructions">
                You can close this window and return to the CLI.
              </p>
            \`;
          }, 500);
        } else {
          throw new Error('Approval failed');
        }
      } catch (err) {
        btn.classList.remove('loading');
        btn.disabled = false;
        alert('Failed to approve device. Please try again.');
      }
    }

    // Poll for approval status
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes

    async function pollStatus() {
      if (pollCount >= maxPolls) return;

      try {
        const response = await fetch('/v1/cli/device/status?code=' + encodeURIComponent(userCode));
        if (response.ok) {
          const data = await response.json();
          if (data.data.approved) {
            window.location.reload();
          }
        }
      } catch {}

      pollCount++;
      setTimeout(pollStatus, 5000);
    }

    // Start polling
    if (userCode) {
      pollStatus();
    }
  </script>
</body>
</html>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m] || m);
  }
}
