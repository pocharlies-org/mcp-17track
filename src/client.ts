const BASE_URL = "https://api.17track.net/track/v2.2";

export class Track17Client {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "17token": this.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limited by 17Track (max 3 req/s)");
      if (res.status === 401) throw new Error("Invalid 17Track API token");
      throw new Error(`17Track API error (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async register(numbers: { number: string; carrier?: number }[]): Promise<unknown> {
    return this.request("/register", numbers.map((n) => ({
      number: n.number,
      ...(n.carrier ? { carrier: n.carrier } : {}),
    })));
  }

  async getTrackInfo(numbers: { number: string; carrier?: number }[]): Promise<unknown> {
    return this.request("/gettrackinfo", numbers.map((n) => ({
      number: n.number,
      ...(n.carrier ? { carrier: n.carrier } : {}),
    })));
  }

  async getTrackList(params?: {
    page_no?: number;
    page_size?: number;
    track_status?: number;
  }): Promise<unknown> {
    return this.request("/gettracklist", {
      page_no: params?.page_no ?? 1,
      page_size: params?.page_size ?? 20,
      ...(params?.track_status !== undefined ? { track_status: params.track_status } : {}),
    });
  }

  async deleteTrack(numbers: string[]): Promise<unknown> {
    return this.request("/deletetrack", numbers.map((n) => ({ number: n })));
  }
}

// Common carrier codes for reference
export const CARRIERS: Record<string, number> = {
  ups: 100002,
  dhl: 100001,
  fedex: 100003,
  correos_express: 100048,
  correos: 100047,
  seur: 100120,
  mrw: 100082,
  gls_spain: 100058,
  dpd: 100039,
};
