import { FormSection } from "../sections/form-section";


interface VideoView {
    videoId: string;
}


export const VideoView = ({ videoId }: VideoView) => {
    return (
        <div className="px-4 pt-2.5 max-w-screen-lg">
            <FormSection videoId={videoId}/>
        </div>
    )
}