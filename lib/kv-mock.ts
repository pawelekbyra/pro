import fs from 'fs';
import path from 'path';

// A very simple in-memory mock for the Vercel KV client
// This is not a full implementation, but it supports the commands used in this app.

export const store = new Map<string, any>();
export const sets = new Map<string, Set<any>>();
export const sortedSets = new Map<string, Map<any, number>>();
export const lists = new Map<string, any[]>();

function loadMockDb() {
  const dbPath = path.join(process.cwd(), 'mock-db.json');
  if (fs.existsSync(dbPath)) {
    console.log('Loading mock database from mock-db.json...');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    for (const [key, value] of data.store) {
      store.set(key, value);
    }
    for (const [key, arr] of data.sets) {
      sets.set(key, new Set(arr));
    }
    for (const [key, arr] of data.sortedSets) {
      sortedSets.set(key, new Map(arr));
    }
    for (const [key, arr] of data.lists) {
      lists.set(key, arr);
    }
    console.log('Mock database loaded successfully.');
  }
}

loadMockDb();

class MockPipeline {
  private commands: [string, ...any[]][] = [];

  get(key: string) {
    this.commands.push(['get', key]);
    return this;
  }

  scard(key: string) {
    this.commands.push(['scard', key]);
    return this;
  }

  smismember(key: string, members: string[]) {
    this.commands.push(['smismember', key, members]);
    return this;
  }

  set(key: string, value: any) {
    this.commands.push(['set', key, value]);
    return this;
  }

  zadd(key: string, ...args: any[]) {
    this.commands.push(['zadd', key, ...args]);
    return this;
  }

  sadd(key: string, member: any) {
    this.commands.push(['sadd', key, member]);
    return this;
  }

  srem(key: string, member: any) {
    this.commands.push(['srem', key, member]);
    return this;
  }

  lpush(key: string, member: any) {
    this.commands.push(['lpush', key, member]);
    return this;
  }

  del(...keys: string[]) {
    this.commands.push(['del', ...keys]);
    return this;
  }

  zrem(key: string, member: any) {
    this.commands.push(['zrem', key, member]);
    return this;
  }


  async exec() {
    const results: any[] = [];
    for (const [command, ...args] of this.commands) {
      // @ts-ignore
      const result = await mockKv[command](...args);
      results.push(result);
    }
    return results;
  }
}

export const mockKv = {
  get<T>(key: string): Promise<T | null> {
    return Promise.resolve(store.get(key) ?? null);
  },

  set(key: string, value: any): Promise<'OK'> {
    store.set(key, value);
    return Promise.resolve('OK');
  },

  sadd(key: string, member: any): Promise<number> {
    if (!sets.has(key)) {
      sets.set(key, new Set());
    }
    const set = sets.get(key)!;
    const initialSize = set.size;
    set.add(member);
    return Promise.resolve(set.size - initialSize);
  },

  srem(key: string, member: any): Promise<number> {
    if (!sets.has(key)) {
      return Promise.resolve(0);
    }
    const set = sets.get(key)!;
    if (set.has(member)) {
      set.delete(member);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  },

  sismember(key: string, member: any): Promise<0 | 1> {
    if (!sets.has(key)) {
      return Promise.resolve(0);
    }
    return Promise.resolve(sets.get(key)!.has(member) ? 1 : 0);
  },

  smismember(key: string, members: string[]): Promise<(0 | 1)[]> {
    if (!sets.has(key)) {
      return Promise.resolve(members.map(() => 0));
    }
    const set = sets.get(key)!;
    return Promise.resolve(members.map((member) => (set.has(member) ? 1 : 0)));
  },

  scard(key: string): Promise<number> {
    return Promise.resolve(sets.get(key)?.size ?? 0);
  },

  zadd(key: string, item: { score: number, member: any }): Promise<number> {
    if (!sortedSets.has(key)) {
      sortedSets.set(key, new Map());
    }
    const zset = sortedSets.get(key)!;
    zset.set(item.member, item.score);
    return Promise.resolve(1);
  },

  zrange(key: string, start: number, stop: number, options?: { rev?: boolean }): Promise<string[]> {
    if (!sortedSets.has(key)) {
      return Promise.resolve([]);
    }
    const zset = sortedSets.get(key)!;
    const items = [...zset.entries()].sort((a, b) => a[1] - b[1]).map(e => e[0]);
    if (options?.rev) {
      items.reverse();
    }
    const end = stop === -1 ? items.length : stop + 1;
    return Promise.resolve(items.slice(start, end));
  },

  zrem(key: string, member: any): Promise<number> {
    if (!sortedSets.has(key)) {
        return Promise.resolve(0);
    }
    const zset = sortedSets.get(key)!;
    if (zset.has(member)) {
        zset.delete(member);
        return Promise.resolve(1);
    }
    return Promise.resolve(0);
  },

  lpush(key: string, member: any): Promise<number> {
    if (!lists.has(key)) {
      lists.set(key, []);
    }
    const list = lists.get(key)!;
    list.unshift(member);
    return Promise.resolve(list.length);
  },

  lrange(key: string, start: number, stop: number): Promise<string[]> {
      if (!lists.has(key)) {
          return Promise.resolve([]);
      }
      const list = lists.get(key)!;
      const end = stop === -1 ? list.length : stop + 1;
      return Promise.resolve(list.slice(start, end));
  },

  del(...keys: string[]): Promise<number> {
      let count = 0;
      for (const key of keys) {
          if (store.has(key)) {
              store.delete(key);
              count++;
          }
          if (sets.has(key)) {
              sets.delete(key);
              count++;
          }
          if (sortedSets.has(key)) {
              sortedSets.delete(key);
              count++;
          }
          if (lists.has(key)) {
              lists.delete(key);
              count++;
          }
      }
      return Promise.resolve(count);
  },

  mget<T>(...keys: string[]): Promise<(T | null)[]> {
    return Promise.resolve(keys.map(key => store.get(key) ?? null));
  },

  keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Promise.resolve([...store.keys()].filter(k => regex.test(k)));
  },

  multi(): MockPipeline {
    return new MockPipeline();
  },

  async flushall(): Promise<'OK'> {
    store.clear();
    sets.clear();
    sortedSets.clear();
    lists.clear();
    return Promise.resolve('OK');
  }
};
