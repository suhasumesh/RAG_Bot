"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faTwitter, faGoogle, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer>
      <div className="d-flex flex-column flex-md-row text-center text-md-start justify-content-between py-4 px-4 px-xl-5 bg-primary">
        <div className="text-white mb-3 mb-md-0">
          Copyright © 2025. All rights reserved.
        </div>
        <div>
          <a href="#!" className="text-white me-4">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="#!" className="text-white me-4">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="#!" className="text-white me-4">
            <FontAwesomeIcon icon={faGoogle} />
          </a>
          <a href="#!" className="text-white">
            <FontAwesomeIcon icon={faLinkedinIn} />
          </a>
        </div>
      </div>
    </footer>
  );
}
