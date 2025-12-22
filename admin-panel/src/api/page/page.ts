import { api } from '@/core/config/api';
import type {
    AboutPage,
    TermsPage,
    AboutPageUpdate,
    TermsPageUpdate
} from "@/types/page/page";

class PageApi {
    async getAboutPage(): Promise<AboutPage> {
        const response = await api.get<AboutPage>('pages/about/');
        return response.data;
    }

    async updateAboutPage(data: AboutPageUpdate): Promise<AboutPage> {
        const response = await api.patch<AboutPage>(
            'pages/about/update_page/',
            data as Record<string, unknown>
        );
        return response.data;
    }

    async getTermsPage(): Promise<TermsPage> {
        const response = await api.get<TermsPage>('pages/terms/');
        return response.data;
    }

    async updateTermsPage(data: TermsPageUpdate): Promise<TermsPage> {
        const response = await api.patch<TermsPage>(
            'pages/terms/update_page/',
            data as Record<string, unknown>
        );
        return response.data;
    }
}

export const pageApi = new PageApi();

