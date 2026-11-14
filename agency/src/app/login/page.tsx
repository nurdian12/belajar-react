import { login } from '../actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="mx-auto mt-24 max-w-sm"><form action={login} className="card space-y-3 p-6">
    <h1 className="text-xl font-semibold">Masuk sebagai CEO</h1><p className="text-sm text-slate-500">AI Digital Marketing Agency</p>
    {error && <p className="rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
    <div><label className="label">Email</label><input className="input" name="email" type="email" required /></div>
    <div><label className="label">Password</label><input className="input" name="password" type="password" minLength={8} required /></div>
    <div className="flex gap-2"><button className="btn flex-1" name="mode" value="signin">Masuk</button><button className="btn btn-ghost flex-1" name="mode" value="signup">Daftar</button></div>
  </form></div>;
}
