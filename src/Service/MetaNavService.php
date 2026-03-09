<?php

namespace Outlandish\Wpackagist\Service;

use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class MetaNavService
{
    private const API_URL = 'https://wpengine.com/api/meta-nav/';
    private const CACHE_KEY = 'wpe_metanav_data';
    private const CACHE_TTL = 3600; // 1 hour

    private CacheInterface $cache;

    public function __construct(CacheInterface $cache)
    {
        $this->cache = $cache;
    }

    /**
     * Get meta navigation data from WP Engine API (cached).
     *
     * @return array|null
     */
    public function getData(): ?array
    {
        try {
            return $this->cache->get(self::CACHE_KEY, function (ItemInterface $item) {
                $item->expiresAfter(self::CACHE_TTL);

                $context = stream_context_create([
                    'http' => [
                        'header' => "Accept: application/json\r\nUser-Agent: WPackagist\r\n",
                        'timeout' => 5,
                    ],
                ]);

                $response = @file_get_contents(self::API_URL, false, $context);

                if ($response === false) {
                    return null;
                }

                return json_decode($response, true);
            });
        } catch (\Exception $e) {
            // Return null to gracefully degrade
            return null;
        }
    }

    /**
     * Get the current domain for highlighting active nav item.
     *
     * @return string
     */
    public function getCurrentDomain(): string
    {
        return 'wpackagist.org';
    }
}
