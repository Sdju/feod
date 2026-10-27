// The tests run the Oxlint CLI with standalone configs. `VP_VERSION` (set in Vite+ managed shells) would
// switch the child processes to Vite+ mode, so it is removed for the whole test run.
delete process.env.VP_VERSION;
