export default function LoadingAnimation() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="40" height="30">
            <circle fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" r="10" cx="40" cy="65">
                <animate
                    attributeName="cy"
                    calcMode="spline"
                    dur="2s"
                    values="65;135;65"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="-.4s"
                />
            </circle>
            <circle fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" r="10" cx="100" cy="65">
                <animate
                    attributeName="cy"
                    calcMode="spline"
                    dur="2s"
                    values="65;135;65"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="-.2s"
                />
            </circle>
            <circle fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" r="10" cx="160" cy="65">
                <animate
                    attributeName="cy"
                    calcMode="spline"
                    dur="2s"
                    values="65;135;65"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="0s"
                />
            </circle>
        </svg>
    )
}

