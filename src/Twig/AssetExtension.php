<?php

namespace Outlandish\Wpackagist\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class AssetExtension extends AbstractExtension
{
    private string $webDir;

    public function __construct(string $projectDir)
    {
        $this->webDir = $projectDir . '/web';
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('asset_version', [$this, 'assetVersion']),
        ];
    }

    /**
     * Returns an asset path with a cache-busting query string based on file modification time.
     */
    public function assetVersion(string $path): string
    {
        $filePath = $this->webDir . $path;

        if (file_exists($filePath)) {
            $mtime = filemtime($filePath);
            return $path . '?v=' . $mtime;
        }

        return $path;
    }
}
