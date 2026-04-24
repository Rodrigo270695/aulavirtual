export type User = {
    id: string;
    first_name: string;
    last_name: string;
    /** Campo virtual: first_name + last_name — generado en HandleInertiaRequests */
    name: string;
    username?: string | null;
    email: string;
    avatar?: string | null;
    document_type?: string | null;
    document_number?: string | null;
    phone_country_code?: string | null;
    phone_number?: string | null;
    country_code?: string | null;
    timezone?: string;
    is_active?: boolean;
    is_banned?: boolean;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
