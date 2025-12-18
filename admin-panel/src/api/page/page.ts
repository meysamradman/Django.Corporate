import { api } from '@/core/config/api';
import {
    AboutPage,
    TermsPage,
    AboutPageUpdate,
    TermsPageUpdate
} from "@/types/page/page";

class PageApi {
    private baseUrl = '/pages/';

    async getAboutPage(): Promise<AboutPage> {
        const response = await fetchApi.get<AboutPage>(
            `${this.baseUrl}about/`
        );
        return response.data;
    }

    async updateAboutPage(data: AboutPageUpdate): Promise<AboutPage> {
        const response = await fetchApi.patch<AboutPage>(
            `${this.baseUrl}about/`,
            data as Record<string, unknown>
        );
        return response.data;
    }

    async getTermsPage(): Promise<TermsPage> {
        const response = await fetchApi.get<TermsPage>(
            `${this.baseUrl}terms/`
        );
        return response.data;
    }

    async updateTermsPage(data: TermsPageUpdate): Promise<TermsPage> {
        const response = await fetchApi.patch<TermsPage>(
            `${this.baseUrl}terms/`,
            data as Record<string, unknown>
        );
        return response.data;
    }
}

export const pageApi = new PageApi();

