declare module '*.styl' {
  export default {} as Record<string, string>
}

declare module '*.scss' {
  export default {} as Record<string, string>
}

declare module '*.png' {
  export default ''
}

declare module '*.webp' {
  export default ''
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_BASE: string
    REACT_APP_OAUTH_CLIENT_ID: string
    REACT_APP_OAUTH_CLIENT_SECRET: string
    NODE_ENV: string
  }
}
