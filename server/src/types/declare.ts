export interface Code {
    user_email: string;
    user_name: string;
    user_password: string;
    code: string;
}

export interface User {
    node_id: number;
    user_email: string;
    user_name: string;
    user_password?: string;
    user_bio: string;
    created_at: string;
}

export interface Insert {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    info: string;
    serverStatus: number;
    warningStatus: number;
    changedRows: number;
}

export interface Repository {
    node_id: number;
    user_email: string;
    group_id: number;
    repo_name: string;
    repo_description: string;
    repo_license: string;
    repo_path: string;
    created_at: string;
}

export interface Branch {
    node_id: number;
    user_email: string;
    repo_id: number;
    branch_name: string;
    branch_description: string;
    branch_path: string;
    created_at: string;
}

export interface CommitGroup {
    node_id: number;
    group_id: string;
    user_email: string;
    repo_id: number;
    branch_id: number;
    group_path: string;
    created_at: string;
}

export interface Commit {
    node_id: number;
    user_email: string;
    commit_name: string;
    commit_group_id: number;
    commit_path: string;
    created_at: string;
}

export interface Ast {
    node_id: number;
    user_email: string;
    content: string;
    created_at: string;
}
