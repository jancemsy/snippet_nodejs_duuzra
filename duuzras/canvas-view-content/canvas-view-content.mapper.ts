
const uuidgen = require('uuid/v1');
export class DuuzraCanvasContentMapper {

    public static getViewType() {
        return 'duuzraCanvasViewContent';
    }

    public static mapCanvasContentToDoc(canvasContent: any) {

        return {
            x: canvasContent.x,
            y: canvasContent.y,
            width: canvasContent.width,
            height: canvasContent.height,
            uuid: canvasContent.uuid,
            canvasUuid: canvasContent.canvasUuid
        }
    }
}
