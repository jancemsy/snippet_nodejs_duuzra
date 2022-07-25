import {IDuuzraInfo} from '../../duuzra_types/duuzras';

export class DuuzraListCacheMapper {

    /**
     * Maps the old CMS event info data to the the model
     * @param rawData The raw CMS data to map
     * @deprecated This method utilises the old CMS to fetch data, this will be overridden by the API in the future
     */
    public static mapDuuzraInfoFromOldCmsData(rawData: any): IDuuzraInfo[] {
        return (rawData && rawData.items ? rawData.items : []).map((item) => {

            // set the default event thumbnail
            let duuzraThumbnail = (item.homepagePreview && !item.homepagePreview.match(/^http/)
                    ? `http://cms.duuzra.com/${item.homepagePreview}`
                    : item.homepagePreview) || null;

            // attempt to override the event thumbnail using the homepage background
            const homepage = item.content.items.find((x) => x.isHomepage);
            if (homepage && homepage.background && homepage.background.url) {
                duuzraThumbnail = homepage.background.url;
            }

            return {
                uuid: item.uuid || null,
                eTag: item.etag || null,
                name: item.name || null,
                thumbnailUrl: duuzraThumbnail,
            };
        });
    }
}
