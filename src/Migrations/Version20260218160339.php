<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260218160339 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Increase ip_address column length from 15 to 45 to support IPv6 addresses';
    }

    public function up(Schema $schema): void
    {
        // Alter ip_address column to support IPv6 (max 45 chars)
        $this->addSql('ALTER TABLE requests ALTER COLUMN ip_address TYPE VARCHAR(45)');
    }

    public function down(Schema $schema): void
    {
        // Revert to original length (only safe if no IPv6 addresses stored)
        $this->addSql('ALTER TABLE requests ALTER COLUMN ip_address TYPE VARCHAR(15)');
    }
}
