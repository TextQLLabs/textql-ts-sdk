import unittest

from scripts.render_mintlify_releases import parse_releases, render


RELEASE = """
## 2026-07-20 17:02:04
### Changes
Based on:
- OpenAPI Doc
- Speakeasy CLI 1.790.3 (2.918.4) https://github.com/speakeasy-api/speakeasy
### Generated
- [typescript v1.0.3] .
### Releases
- [NPM v1.0.3] https://www.npmjs.com/package/@textql/sdk/v/1.0.3 - .
"""


class RenderMintlifyReleasesTest(unittest.TestCase):
    def test_parses_speakeasy_release_format(self) -> None:
        release = parse_releases(RELEASE)[0]
        self.assertEqual(release.version, "1.0.3")
        self.assertEqual(
            release.npm_url,
            "https://www.npmjs.com/package/@textql/sdk/v/1.0.3",
        )
        self.assertEqual(release.speakeasy_cli, "1.790.3")
        self.assertEqual(release.generator_version, "2.918.4")

    def test_accepts_standard_markdown_npm_link(self) -> None:
        markdown = RELEASE.replace(
            "[NPM v1.0.3] https://www.npmjs.com/package/@textql/sdk/v/1.0.3 - .",
            "[NPM v1.0.3](https://www.npmjs.com/package/@textql/sdk/v/1.0.3)",
        )
        self.assertEqual(parse_releases(markdown)[0].version, "1.0.3")

    def test_renders_mintlify_updates(self) -> None:
        output = render(RELEASE)
        self.assertIn('title: "TypeScript SDK release log"', output)
        self.assertIn(
            '<Update label="v1.0.3" description="July 20, 2026">', output
        )
        self.assertIn("npm install @textql/sdk@1.0.3", output)
        self.assertIn("[Speakeasy CLI 1.790.3 (generator 2.918.4)]", output)

    def test_skips_unpublished_generation_record(self) -> None:
        unpublished = """
## 2026-07-20 23:03:28
### Changes
Based on:
- OpenAPI Doc
- Speakeasy CLI 1.790.3 (2.918.4) https://github.com/speakeasy-api/speakeasy
### Generated
- [typescript v1.0.4] .
"""
        releases = parse_releases(RELEASE + unpublished)
        self.assertEqual([release.version for release in releases], ["1.0.3"])

    def test_rejects_log_without_published_releases(self) -> None:
        with self.assertRaisesRegex(ValueError, "published NPM releases"):
            parse_releases(RELEASE.replace("NPM", "Package"))


if __name__ == "__main__":
    unittest.main()
