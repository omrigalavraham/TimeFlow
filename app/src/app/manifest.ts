import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TimeFlow',
        short_name: 'TimeFlow',
        description: 'Minimalist Productivity Assistant',
        start_url: '/',
        display: 'standalone',
        background_color: '#F8F9FA',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
