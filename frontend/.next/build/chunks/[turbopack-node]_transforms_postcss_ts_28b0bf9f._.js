module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/g/ecommerce-platform/frontend/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/6e8fd_a84ab117._.js",
  "chunks/[root-of-the-server]__de7b7a57._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/g/ecommerce-platform/frontend/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];