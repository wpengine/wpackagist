<?php

namespace Outlandish\Wpackagist\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RequestRepository::class)]
#[ORM\Table(name: 'requests')]
class Request
{
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    protected int $id;

    #[ORM\Column(type: 'string', length: 15, unique: true)]
    protected string $ipAddress;

    #[ORM\Column(type: 'datetime')]
    protected DateTime $lastRequest;

    #[ORM\Column(type: 'integer')]
    protected int $requestCount = 0;

    public function addRequest(): void
    {
        $this->requestCount++;
        $this->lastRequest = new \DateTime();
    }

    public function getRequestCount(): int
    {
        return $this->requestCount;
    }

    public function setIpAddress(string $ipAddress): void
    {
        $this->ipAddress = $ipAddress;
    }

    public function setRequestCount(int $requestCount): void
    {
        $this->requestCount = $requestCount;
    }
}
