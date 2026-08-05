import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


SCRIPT = Path(__file__).with_name("mascot.py")


def save_rgba(path, array):
    Image.fromarray(array.astype(np.uint8), "RGBA").save(path)


class ProtectMaskRegressionTests(unittest.TestCase):
    def run_protected_color_case(self, prop_rgb):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            master = np.zeros((80, 80, 4), dtype=np.uint8)
            pose = np.zeros_like(master)
            mask = np.zeros_like(master)
            master[12:68, 12:42] = (210, 40, 35, 255)
            pose[12:68, 12:42] = (202, 44, 39, 255)
            pose[24:60, 50:72] = (*prop_rgb, 255)
            mask[24:60, 50:72] = (255, 255, 255, 255)
            master_path = root / "master.png"
            pose_path = root / "pose.png"
            mask_path = root / "mask.png"
            out_path = root / "out.png"
            save_rgba(master_path, master)
            save_rgba(pose_path, pose)
            save_rgba(mask_path, mask)
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(master_path), str(pose_path),
                 "-o", str(out_path), "--protect-mask", str(mask_path),
                 "--keep-edge", "--k", "3"],
                check=False, capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            output = np.asarray(Image.open(out_path).convert("RGBA"))
            np.testing.assert_array_equal(
                output[24:60, 50:72, :3], pose[24:60, 50:72, :3]
            )

    def test_protected_prop_colors_same_near_and_different_are_exact(self):
        cases = {
            "same_as_character": (210, 40, 35),
            "near_common_gray": (138, 143, 148),
            "different_cyan": (30, 190, 205),
        }
        for name, color in cases.items():
            with self.subTest(name=name):
                self.run_protected_color_case(color)

    def test_protected_prop_is_byte_exact_while_character_is_corrected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            master = np.zeros((96, 96, 4), dtype=np.uint8)
            pose = np.zeros_like(master)
            mask = np.zeros_like(master)

            # Character material: red block. Pose drifts darker and must move.
            master[20:76, 35:61] = (220, 30, 25, 255)
            pose[20:76, 35:61] = (208, 35, 30, 255)

            # One-off prop: near-gray color deliberately close to common mascot
            # materials. It must remain byte-identical.
            pose[30:66, 68:88] = (138, 143, 148, 255)
            mask[30:66, 68:88] = (255, 255, 255, 255)

            master_path = root / "master.png"
            pose_path = root / "pose.png"
            mask_path = root / "mask.png"
            out_path = root / "out.png"
            save_rgba(master_path, master)
            save_rgba(pose_path, pose)
            save_rgba(mask_path, mask)

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(master_path), str(pose_path),
                 "-o", str(out_path), "--protect-mask", str(mask_path),
                 "--keep-edge", "--k", "3"],
                check=False, capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("protected:", result.stdout)

            output = np.asarray(Image.open(out_path).convert("RGBA"))
            np.testing.assert_array_equal(
                output[30:66, 68:88, :3], pose[30:66, 68:88, :3]
            )

            before_error = np.abs(pose[30:60, 40:56, :3].astype(int) -
                                  master[30:60, 40:56, :3].astype(int)).mean()
            after_error = np.abs(output[30:60, 40:56, :3].astype(int) -
                                 master[30:60, 40:56, :3].astype(int)).mean()
            self.assertLess(after_error, before_error)

    def test_mask_size_mismatch_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            image = np.zeros((64, 64, 4), dtype=np.uint8)
            image[8:56, 8:56] = (200, 50, 40, 255)
            small_mask = np.zeros((32, 32, 4), dtype=np.uint8)
            small_mask[4:28, 4:28] = (255, 255, 255, 255)
            master = root / "master.png"
            pose = root / "pose.png"
            mask = root / "mask.png"
            save_rgba(master, image)
            save_rgba(pose, image)
            save_rgba(mask, small_mask)
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(master), str(pose),
                 "--check", "--protect-mask", str(mask)],
                check=False, capture_output=True, text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("protect mask must match target size", result.stdout)


if __name__ == "__main__":
    unittest.main()
