(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/g/ecommerce-platform/frontend/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/g/ecommerce-platform/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/g/ecommerce-platform/frontend/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
// API base URL - reads from environment variable
const API_URL = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
// Create axios instance
const api = __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});
// Add token to requests if available
// Use sessionStorage so each tab has its own session
api.interceptors.request.use((config)=>{
    if ("TURBOPACK compile-time truthy", 1) {
        const token = sessionStorage.getItem('token'); // Changed from localStorage to sessionStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
// Handle response errors
api.interceptors.response.use((response)=>response, (error)=>{
    // Log network errors for debugging
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('🚨 Network Error - Backend not reachable:', {
            baseURL: api.defaults.baseURL,
            url: error.config?.url,
            message: 'Make sure the backend server is running on port 5000'
        });
    }
    if (error.response?.status === 401) {
        // Token expired or invalid
        if ("TURBOPACK compile-time truthy", 1) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
const __TURBOPACK__default__export__ = api;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/g/ecommerce-platform/frontend/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/g/ecommerce-platform/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/g/ecommerce-platform/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/g/ecommerce-platform/frontend/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const AuthProvider = ({ children })=>{
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Use sessionStorage instead of localStorage - each tab gets its own session
    // This allows different users to be logged in different tabs
    const getStorage = ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return sessionStorage; // Each tab has its own sessionStorage
    };
    // Check if user is logged in on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            checkAuth();
        }
    }["AuthProvider.useEffect"], []);
    const checkAuth = async ()=>{
        try {
            const storage = getStorage();
            if (!storage) return;
            const token = storage.getItem('token');
            if (!token) {
                setLoading(false);
                setUser(null);
                return;
            }
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setUser(response.data.user);
            } else {
                storage.removeItem('token');
                storage.removeItem('userId');
                setUser(null);
            }
        } catch (error) {
            const storage = getStorage();
            if (storage) {
                storage.removeItem('token');
                storage.removeItem('userId');
            }
            setUser(null);
        } finally{
            setLoading(false);
        }
    };
    const login = async (email, password)=>{
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/auth/login', {
            email,
            password
        });
        if (response.data.success) {
            const storage = getStorage();
            if (storage) {
                storage.setItem('token', response.data.token);
                storage.setItem('userId', response.data.user.id);
            }
            setUser(response.data.user);
        }
    };
    const register = async (name, email, password)=>{
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/auth/register', {
            name,
            email,
            password
        });
        if (response.data.success) {
            const storage = getStorage();
            if (storage) {
                storage.setItem('token', response.data.token);
                storage.setItem('userId', response.data.user.id);
            }
            setUser(response.data.user);
        }
    };
    const logout = ()=>{
        const storage = getStorage();
        if (storage) {
            storage.removeItem('token');
            storage.removeItem('userId');
        }
        setUser(null);
        if ("TURBOPACK compile-time truthy", 1) {
            window.location.href = '/login';
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/g/ecommerce-platform/frontend/contexts/AuthContext.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$g$2f$ecommerce$2d$platform$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=g_ecommerce-platform_frontend_0590bba4._.js.map