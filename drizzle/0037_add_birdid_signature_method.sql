-- Add birdid_cloud to signature_method enum
ALTER TYPE "signature_method" ADD VALUE IF NOT EXISTS 'birdid_cloud';
