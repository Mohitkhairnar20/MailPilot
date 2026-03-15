 = 'frontend\src\pages\CreateCampaignPage.jsx'
 = Get-Content  -Raw
 = @'
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setContentMode("manual")}
                      className={contentMode === "manual" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">Manual</p>
                      <p className={contentMode === "manual" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Type subject and content directly.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("ai")}
                      className={contentMode === "manual" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">AI assisted</p>
                      <p className={contentMode === "manual" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Generate a draft from a prompt, then edit it.
                      </p>
                    </button>
                  </div>
'@
 = @'
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setContentMode("manual")}
                      className={contentMode === "manual" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">Manual</p>
                      <p className={contentMode === "manual" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Type subject and content directly.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode("ai")}
                      className={contentMode === "ai" ? "rounded-xl border border-[#132238] bg-[#132238] px-4 py-3 text-left text-white transition" : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition"}
                    >
                      <p className="text-sm font-semibold">AI assisted</p>
                      <p className={contentMode === "ai" ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
                        Generate a draft from a prompt, then edit it.
                      </p>
                    </button>
                  </div>
'@
if (-not .Contains()) { throw 'button mode block not found' }
 = .Replace(, )
Set-Content  
