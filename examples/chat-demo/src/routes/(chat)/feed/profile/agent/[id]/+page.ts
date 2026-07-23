import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params, url }) => {
	redirect(307, `/agents/${params.id}${url.search}`);
};
