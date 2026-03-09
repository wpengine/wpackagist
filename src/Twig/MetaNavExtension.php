<?php

namespace Outlandish\Wpackagist\Twig;

use Outlandish\Wpackagist\Service\MetaNavService;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;

class MetaNavExtension extends AbstractExtension implements GlobalsInterface
{
    private MetaNavService $metaNavService;

    public function __construct(MetaNavService $metaNavService)
    {
        $this->metaNavService = $metaNavService;
    }

    public function getGlobals(): array
    {
        return [
            'metanav_data' => $this->metaNavService->getData(),
            'current_domain' => $this->metaNavService->getCurrentDomain(),
        ];
    }
}
