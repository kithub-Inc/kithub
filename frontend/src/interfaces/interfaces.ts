export interface IUser {
    node_id?: number;
    user_email?: string;
    user_name?: string;
    user_bio?: string;
    avatar_src?: string;
    created_at?: string;
}

export interface IRepository {
    node_id: number;
    user_email: string;
    user_name: string;
    repo_name: string;
    repo_description: string;
    repo_category: string;
    repo_subcategory: string;
    repo_visibility: number;
    repo_archive: number;
    repo_license: string;
    repo_grantes: any[];
    image_src: string;
    created_at: string;
}

export interface IBranch {
    node_id?: number;
    repo_id?: number;
    branch_name?: string;
    branch_src?: string;
    created_at?: string;
}

export interface ICommit {
    node_id: number;
    branch_id: number;
    commit_src: string;
    commit_message: string;
    created_at: string;
}

export interface IDirectory {
    name: string;
    type: string;
    content: string;
}

export interface IProps {
    branch: IBranch;
    directory: IDirectory[];
    prevDirectory: IDirectory[];
    readme: string;
    content: string;
    viewDirectory: IDirectory[];
    setViewDirectory: Function;
    fileName: string;
    setFileName: Function;
    repository?: IRepository;
}

export interface IIssue {
    node_id: number;
    repo_id: number;
    user_email: string;
    issue_title: string;
    issue_content: string;
    issue_status: `대기` | `진행중` | `성공` | `실패`;
    created_at: string;
}

export interface IComments {
    node_id: number;
    issue_id: number;
    user_email: string;
    comment_target_id: string;
    comment_type: string;
    comment_content: string;
    created_at: string;

    hearts: { node_id: number; comment_id: number; user_email: string; created_at: string; }[];

    user_name: string;
    avatar_src: string;
}

export interface IStar {
    node_id: number;
    repo_id: number;
    user_email: string;
    created_at: string;
}