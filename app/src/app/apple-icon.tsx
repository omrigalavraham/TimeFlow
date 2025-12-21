import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 100,
                    background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '35px', // Apple style rounded corners (roughly 22% of size)
                    fontWeight: 900,
                    fontFamily: 'sans-serif',
                }}
            >
                TF
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
